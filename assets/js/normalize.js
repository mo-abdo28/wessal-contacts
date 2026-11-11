/* =====================================================================
 * Wessal Contacts — phone normalisation & search normalisation
 * ---------------------------------------------------------------------
 * Phone rules (Egypt default, country code +20):
 *   "+201002135438"        -> 201002135438   (already international)
 *   "00201002135438"      -> 201002135438   (00 prefix = international)
 *   "01002135438"         -> 201002135438   (local trunk 0 replaced by 20)
 *   "0100 213 5438"       -> 201002135438   (spaces/symbols stripped)
 *   "16140"               -> 16140          (5-digit short code, kept as-is)
 *
 *   wa.me link  -> https://wa.me/<digits>          (no +)
 *   tel: link   -> tel:+<digits>                   (with +)
 *
 * Short codes (4-6 digits, no leading zero) are hotlines: they are NOT
 * international numbers, so no country code is added and WhatsApp is
 * not offered for them.
 * ===================================================================== */
window.W = window.W || {};

/* ---- Country code / short-code detection -------------------------- */
W.DEFAULT_CC = (window.WESSAL_CONFIG && window.WESSAL_CONFIG.DEFAULT_COUNTRY_CODE) || "20";

/**
 * Normalise a raw phone string to digits-only international form.
 * @param {string} raw        user input
 * @param {string} [cc]       country code, default 20
 * @returns {{digits:string, short:boolean, valid:boolean}|null}
 */
W.normalizePhone = function (raw, cc) {
  cc = (cc || W.DEFAULT_CC).replace(/\D/g, "") || "20";
  if (raw === null || raw === undefined) return null;

  var text = String(raw).trim();
  if (!text) return null;

  var hadPlus = /^\s*\+/.test(text);
  var digits = text.replace(/\D/g, "");
  if (!digits) return null;

  // 1. Explicit international forms
  if (hadPlus) {
    return { digits: digits, short: false, valid: digits.length >= 7 && digits.length <= 15 };
  }
  if (digits.length > 2 && digits.slice(0, 2) === "00") {
    var intl = digits.slice(2);
    return { digits: intl, short: false, valid: intl.length >= 7 && intl.length <= 15 };
  }

  // 2. Short codes / hotlines (e.g. 19466, 16140) — keep verbatim.
  //    They must not be mistaken for a national number missing its 0.
  if (digits.length <= 6 && digits.charAt(0) !== "0") {
    return { digits: digits, short: true, valid: true };
  }

  // 3. Already carries the country code (e.g. 201002135438 = 12 digits)
  if (digits.indexOf(cc) === 0 && digits.length >= 11) {
    return { digits: digits, short: false, valid: digits.length <= 15 };
  }

  // 4. National format with trunk zero (010... -> 20 + 10...)
  if (digits.charAt(0) === "0") {
    var body = digits.replace(/^0+/, "");
    var res = cc + body;
    return { digits: res, short: false, valid: res.length >= 8 && res.length <= 15 };
  }

  // 5. National format without trunk zero (landline written as 23456789)
  var plain = cc + digits;
  return { digits: plain, short: false, valid: plain.length >= 8 && plain.length <= 15 };
};

/** Convenience: digits only (or "" when invalid). */
W.normalizePhoneDigits = function (raw, cc) {
  var r = W.normalizePhone(raw, cc);
  return r && r.valid ? r.digits : "";
};

/** True when the number is a short hotline rather than a full number. */
W.isShortCode = function (raw) {
  var r = W.normalizePhone(raw);
  return !!(r && r.short);
};

/** WhatsApp deep link (digits only, no +). */
W.waLink = function (digits) {
  return "https://wa.me/" + String(digits).replace(/\D/g, "");
};

/** Tel: deep link (international numbers get a leading +). */
W.telLink = function (digits) {
  var d = String(digits).replace(/\D/g, "");
  if (!d) return "";
  return "tel:" + (d.length <= 6 ? d : "+" + d);
};

/* ---------------------------------------------------------------------
 * Search normalisation
 * ---------------------------------------------------------------------
 * Makes Arabic search forgiving:
 *   - removes tashkeel / diacritics and tatweel
 *   - أ إ آ ٱ -> ا      (alef variants)
 *   - ة -> ه            (teh marbuta)
 *   - ى -> ي            (alef maksura)
 *   - ؤ -> و , ئ -> ي
 *   - converts Arabic-Indic digits (٠-٩) to ASCII
 *   - lowercases Latin text
 * ------------------------------------------------------------------- */
W.normalizeSearch = function (value) {
  if (value === null || value === undefined) return "";
  var s = String(value);

  // Arabic-Indic (U+0660-0669) and Extended Arabic-Indic (U+06F0-06F9) -> ASCII
  s = s.replace(/[\u0660-\u0669]/g, function (d) {
    return String(d.charCodeAt(0) - 0x0660);
  });
  s = s.replace(/[\u06F0-\u06F9]/g, function (d) {
    return String(d.charCodeAt(0) - 0x06F0);
  });

  // Strip diacritics (fatha..sukun), superscript alef, quranic marks, tatweel
  s = s.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "");

  // Letter unification
  s = s.replace(/[\u0622\u0623\u0625\u0671\u0672\u0673]/g, "\u0627"); // آأإٱٲٳ -> ا
  s = s.replace(/\u0629/g, "\u0647");  // ة -> ه
  s = s.replace(/\u0649/g, "\u064A");  // ى -> ي
  s = s.replace(/\u0624/g, "\u0648");  // ؤ -> و
  s = s.replace(/\u0626/g, "\u064A");  // ئ -> ي
  s = s.replace(/\u06CC/g, "\u064A");  // ی -> ي
  s = s.replace(/\u06A9/g, "\u0643");  // ک -> ك

  // Phone-ish separators are noise when searching by number
  s = s.replace(/[\s\-()]/g, "");

  return s.toLowerCase();
};

/** Does a contact match the search query? Searches name, org, notes, numbers. */
W.contactMatches = function (contact, query) {
  var q = W.normalizeSearch(query);
  if (!q) return true;

  var fields = [
    contact.name,
    contact.organization,
    contact.notes,
    contact.category
  ];

  for (var i = 0; i < fields.length; i++) {
    if (fields[i] && W.normalizeSearch(fields[i]).indexOf(q) !== -1) return true;
  }

  // Numeric match against the stored digits
  if (/^\d+$/.test(q)) {
    if (contact.phone && String(contact.phone).indexOf(q) !== -1) return true;
    if (contact.phone_secondary && String(contact.phone_secondary).indexOf(q) !== -1) return true;
  }
  return false;
};

/** Display helper: group digits for readability (keeps LTR order). */
W.formatPhoneDisplay = function (digits) {
  var d = String(digits || "");
  if (!d) return "";
  if (d.length <= 6) return d;             // short code
  if (d.length === 12 && d.indexOf("20") === 0) {
    // Egyptian mobile: +20 1XX XXX XXXX
    var n = d.slice(2);
    return "+20 " + n.slice(0, 3) + " " + n.slice(3, 6) + " " + n.slice(6);
  }
  if (d.length === 11 && d.indexOf("20") === 0) {
    // Egyptian landline: +20 2 XXXX XXXX
    var m = d.slice(2);
    return "+20 " + m.slice(0, 1) + " " + m.slice(1, 5) + " " + m.slice(5);
  }
  return "+" + d;
};

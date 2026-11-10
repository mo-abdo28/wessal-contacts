/* =====================================================================
 * Wessal Contacts — import & export
 * ---------------------------------------------------------------------
 * CSV  : parsed in pure JavaScript (no dependency, works offline).
 * Excel: parsed with SheetJS loaded from a CDN on demand.
 * ===================================================================== */
window.W = window.W || {};

/* Fields the user can map file columns onto. */
W.IMPORT_FIELDS = [
  { key: "name",          label: "import.col.name" },
  { key: "organization",  label: "import.col.organization" },
  { key: "phone",         label: "import.col.phone", required: true },
  { key: "phone_secondary", label: "import.col.phone2" },
  { key: "has_whatsapp",  label: "import.col.has_whatsapp" },
  { key: "category",      label: "import.col.category" },
  { key: "notes",         label: "import.col.notes" }
];

/* Guess which file column matches which field, by header name. */
W.IMPORT_HEADER_HINTS = {
  name:             ["name", "full name", "person", "contact", "الاسم", "الاسم بالكامل"],
  organization:     ["organization", "organisation", "company", "org", "institution", "الجهة", "المؤسسة", "الشركة"],
  phone:            ["phone", "mobile", "phone1", "phone number", "primary", "number", "tel", "الهاتف", "الهاتف المحمول", "رقم الهاتف"],
  phone_secondary:  ["phone2", "phone 2", "secondary", "second number", "alt phone", "الرقم الثاني", "رقم ثان"],
  has_whatsapp:     ["whatsapp", "wa", "has whatsapp", "has_wa", "واتساب", "هل يوجد واتساب"],
  category:         ["category", "type", "group", "الفئة", "النوع"],
  notes:            ["notes", "note", "comment", "comments", "remarks", "ملاحظات", "ملاحظه"]
};

W.io = {
  _xlsxReady: null,

  /* ---------- Load SheetJS on demand (for .xlsx files) ---------- */
  loadXlsx: function () {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (this._xlsxReady) return this._xlsxReady;

    this._xlsxReady = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = W.CDN.xlsx;
      s.onload = function () {
        if (window.XLSX) resolve(window.XLSX);
        else reject(new Error("xlsx-unavailable"));
      };
      s.onerror = function () { reject(new Error("xlsx-unavailable")); };
      document.head.appendChild(s);
    });
    return this._xlsxReady;
  },

  /* ---------- CSV parser ---------- */
  /**
   * Parse CSV text into { headers: [], rows: [[...]] }.
   * Handles quoted fields, escaped quotes, commas and newlines in quotes.
   */
  parseCsv: function (text) {
    // Strip a UTF-8 BOM if present
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

    var rows = [];
    var row = [];
    var field = "";
    var inQuotes = false;

    for (var i = 0; i < text.length; i++) {
      var ch = text[i];

      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else { inQuotes = false; }
        } else {
          field += ch;
        }
        continue;
      }

      if (ch === '"') { inQuotes = true; continue; }
      if (ch === ",") { row.push(field); field = ""; continue; }
      if (ch === "\r") continue;
      if (ch === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        continue;
      }
      field += ch;
    }
    // last field / row
    if (field.length || row.length) {
      row.push(field);
      rows.push(row);
    }
    // drop trailing empty rows
    while (rows.length && rows[rows.length - 1].every(function (c) { return !String(c).trim(); })) {
      rows.pop();
    }
    return { headers: rows[0] || [], rows: rows.slice(1) };
  },

  /* ---------- Read a user-selected file ---------- */
  /**
   * @param {File} file
   * @returns {Promise<{headers:[], rows:[[]], sheetName:string}>}
   */
  readFile: function (file) {
    var name = (file.name || "").toLowerCase();
    var self = this;

    if (/\.xlsx$|\.xls$/.test(name)) {
      return this.loadXlsx().then(function (XLSX) {
        return file.arrayBuffer().then(function (buf) {
          var wb = XLSX.read(buf, { type: "array" });
          // Prefer a sheet literally called "Contacts"; else the first sheet.
          var sheetName = wb.SheetNames.indexOf("Contacts") !== -1
            ? "Contacts"
            : wb.SheetNames[0];
          var sheet = wb.Sheets[sheetName];
          var aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: "" });
          if (!aoa.length) throw new Error("empty");
          return {
            sheetName: sheetName,
            headers: (aoa[0] || []).map(function (h) { return String(h).trim(); }),
            rows: aoa.slice(1)
          };
        });
      });
    }

    // Plain text / CSV
    return file.text().then(function (text) {
      var parsed = self.parseCsv(text);
      if (!parsed.headers.length || !parsed.rows.length) throw new Error("empty");
      return { sheetName: "CSV", headers: parsed.headers, rows: parsed.rows };
    });
  },

  /* ---------- Automatic column mapping ---------- */
  guessMapping: function (headers) {
    var map = {};
    var used = {};

    W.IMPORT_FIELDS.forEach(function (field) {
      var hints = W.IMPORT_HEADER_HINTS[field.key] || [];
      var found = -1;

      // 1. exact / near-exact header match
      for (var i = 0; i < headers.length; i++) {
        if (used[i]) continue;
        var h = W.normalizeSearch(headers[i]);
        if (!h) continue;
        for (var j = 0; j < hints.length; j++) {
          if (h === W.normalizeSearch(hints[j])) { found = i; break; }
        }
        if (found !== -1) break;
      }

      // 2. contains match
      if (found === -1) {
        for (var k = 0; k < headers.length; k++) {
          if (used[k]) continue;
          var hk = W.normalizeSearch(headers[k]);
          if (!hk) continue;
          for (var m = 0; m < hints.length; m++) {
            var hint = W.normalizeSearch(hints[m]);
            if (hint && (hk.indexOf(hint) !== -1 || hint.indexOf(hk) !== -1)) {
              found = k;
              break;
            }
          }
          if (found !== -1) break;
        }
      }

      // 3. fallback for the phone column: the first column that looks numeric
      if (found === -1 && field.key === "phone") {
        for (var p = 0; p < headers.length; p++) {
          if (used[p]) continue;
          if (/phone|mobile|tel|number|هاتف/i.test(headers[p])) { found = p; break; }
        }
      }

      if (found !== -1) {
        map[field.key] = found;
        used[found] = true;
      } else {
        map[field.key] = -1;
      }
    });

    return map;
  },

  /* ---------- Turn mapped rows into contact rows ---------- */
  /**
   * @param {string[]} headers
   * @param {array[]} rawRows
   * @param {object}   mapping       field key -> column index
   * @param {object}   usedPrimary   set of main numbers already in the DB
   * @param {object}   [usedAll]     set of every number (main + secondary)
   * @returns {{rows:[], invalid:[], duplicates:[], shared:[]}}
   *
   * A row is SKIPPED as a duplicate only when its MAIN number already
   * exists as another contact's MAIN number. A number that is only used
   * as somebody's secondary number is reported as "shared" but still
   * imported — the source data deliberately keeps such rows.
   */
  buildRows: function (headers, rawRows, mapping, usedPrimary, usedAll) {
    var out = { rows: [], invalid: [], duplicates: [], shared: [] };
    var seenPrimary = {};
    var seenAll = {};

    rawRows.forEach(function (cells, index) {
      function get(key) {
        var col = mapping[key];
        if (col === undefined || col === null || col < 0) return "";
        var v = cells[col];
        return v === undefined || v === null ? "" : String(v).trim();
      }

      var name = get("name");
      var org = get("organization");
      var rawPhone = get("phone");
      var rawPhone2 = get("phone_secondary");
      var waRaw = get("has_whatsapp").toLowerCase();
      var cat = get("category");
      var notes = get("notes");

      if (!name && !org && !rawPhone) return; // fully empty row

      var phoneRes = W.normalizePhone(rawPhone);
      var phone2Res = W.normalizePhone(rawPhone2);

      var entry = {
        line: index + 2, // +2 = header row + 1-based numbering
        name: name,
        organization: org,
        phone: phoneRes ? phoneRes.digits : "",
        phone_secondary: phone2Res ? phone2Res.digits : "",
        has_whatsapp: /^(y|yes|true|1|نعم)$/i.test(waRaw),
        category: cat || "Other",
        notes: notes,
        valid: true,
        duplicate: false,
        shared: false
      };

      if (!waRaw) {
        // No value in the file: default to yes for full numbers, no for hotlines.
        entry.has_whatsapp = !(phoneRes && phoneRes.short);
      }
      if (phoneRes && phoneRes.short) entry.has_whatsapp = false;

      if (!entry.phone || (phoneRes && !phoneRes.valid)) {
        entry.valid = false;
        out.invalid.push(entry);
        return;
      }

      // Duplicate main number -> skip this row
      if (usedPrimary[entry.phone] || seenPrimary[entry.phone]) {
        entry.duplicate = true;
        out.duplicates.push(entry);
        return;
      }
      seenPrimary[entry.phone] = true;

      // The main number is only used as somebody's SECONDARY number
      // (already in the database, or earlier in this same file):
      // keep the row, but flag it so the admin knows.
      if ((usedAll && usedAll[entry.phone] && !usedPrimary[entry.phone]) ||
          (seenAll && seenAll[entry.phone])) {
        entry.shared = true;
        out.shared.push(entry);
      }
      if (entry.phone_secondary) seenAll[entry.phone_secondary] = true;

      out.rows.push(entry);
    });

    return out;
  },

  /* ---------- Export ---------- */

  /** Build a CSV string from contact rows (UTF-8 with BOM for Excel). */
  toCsv: function (contacts) {
    var head = ["Name", "Organization", "Phone", "Phone2", "WhatsApp", "Category", "Notes"];
    var lines = [head.join(",")];

    contacts.forEach(function (c) {
      lines.push([
        c.name || "",
        c.organization || "",
        c.phone || "",
        c.phone_secondary || "",
        c.has_whatsapp ? "yes" : "no",
        c.category || "",
        c.notes || ""
      ].map(csvCell).join(","));
    });

    return "\uFEFF" + lines.join("\r\n");
  },

  /** Export to .xlsx using SheetJS (falls back to CSV if unavailable). */
  toXlsx: function (contacts) {
    var self = this;
    return this.loadXlsx().then(function (XLSX) {
      var head = ["Name", "Organization", "Phone", "Phone2", "WhatsApp", "Category", "Notes"];
      var aoa = [head];
      contacts.forEach(function (c) {
        aoa.push([
          c.name || "",
          c.organization || "",
          c.phone || "",
          c.phone_secondary || "",
          c.has_whatsapp ? "yes" : "no",
          c.category || "",
          c.notes || ""
        ]);
      });
      var ws = XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = [
        { wch: 24 }, { wch: 34 }, { wch: 16 }, { wch: 16 },
        { wch: 10 }, { wch: 14 }, { wch: 50 }
      ];
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Contacts");
      return XLSX.write(wb, { bookType: "xlsx", type: "array" });
    }).catch(function () {
      return null; // caller falls back to CSV
    });
  },

  /** Trigger a browser download. */
  download: function (blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  },

  downloadCsv: function (contacts) {
    var csv = this.toCsv(contacts);
    this.download(new Blob([csv], { type: "text/csv;charset=utf-8" }),
      "wessal-contacts.csv");
  },

  downloadXlsx: function (contacts) {
    var self = this;
    return this.toXlsx(contacts).then(function (buf) {
      if (!buf) {
        self.downloadCsv(contacts);
        return false;
      }
      self.download(
        new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        "wessal-contacts.xlsx"
      );
      return true;
    });
  }
};

/* Escape one CSV cell. */
function csvCell(value) {
  var s = String(value === null || value === undefined ? "" : value);
  if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

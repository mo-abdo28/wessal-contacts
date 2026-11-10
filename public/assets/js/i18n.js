/* =====================================================================
 * Wessal Contacts — internationalisation
 * ---------------------------------------------------------------------
 * Every user-visible string lives here. To add a language, copy a block,
 * translate the values, and register it in W.LANGS below.
 *
 * Keys ending in "Placeholder" fill input placeholders.
 * Keys ending in "Aria" fill aria-label attributes.
 * ===================================================================== */
window.W = window.W || {};

W.LANGS = ["ar", "en"];
W.DEFAULT_LANG = "ar";

W.I18N = {
  /* ================= ARABIC ================= */
  ar: {
    "app.title": "دليل جهات الاتصال",
    "app.tagline": "فريق tissal",   /* placeholder, overwritten below */
    "role.admin": "مدير",
    "role.member": "عضو",

    "auth.subtitle": "سجّل الدخول بحساب فريقك",
    "auth.username": "اسم المستخدم",
    "auth.usernamePlaceholder": "wessal",
    "auth.password": "كلمة المرور",
    "auth.passwordPlaceholder": "••••••••",
    "auth.signIn": "تسجيل الدخول",
    "auth.signingIn": "جارٍ الدخول…",
    "auth.showPassword": "إظهار كلمة المرور",
    "auth.hidePassword": "إخفاء كلمة المرور",
    "auth.help": "تحتاج إلى حساب؟ تواصل مع مدير النظام.",
    "auth.error.empty": "من فضلك أدخل اسم المستخدم وكلمة المرور.",
    "auth.error.invalid": "اسم المستخدم أو كلمة المرور غير صحيحة.",
    "auth.error.network": "تعذّر الاتصال بقاعدة البيانات. تحقق من الإنترنت وحاول مرة أخرى.",
    "auth.error.config": "لم يتم إعداد قاعدة البيانات بعد. راجع ملف config.js.",

    "header.role": "الصلاحية",
    "header.theme": "تبديل الوضع الليلي",
    "header.logout": "تسجيل الخروج",
    "header.adminTools": "أدوات الإدارة",
    "header.language": "English",

    "preview.banner": "وضع المعاينة بدون قاعدة بيانات — البيانات محفوظة على هذا الجهاز فقط.",
    "preview.role": "معاينة كـ",

    "search.placeholder": "ابحث بالاسم أو الجهة أو الرقم…",
    "search.clear": "مسح البحث",

    "stats.total": "الإجمالي",
    "stats.withWa": "متوفر واتساب",
    "stats.withoutWa": "بدون واتساب",

    "filters.all": "الكل",
    "filters.allCategories": "كل الفئات",
    "filters.withWa": "متوفر واتساب",
    "filters.withoutWa": "بدون واتساب",
    "filters.whatsapp": "تصفية حسب واتساب",
    "filters.category": "تصفية حسب الفئة",
    "filters.sort": "الترتيب",
    "filters.sortName": "الاسم (أ-ي)",
    "filters.sortNewest": "الأحدث أولاً",
    "filters.sortCategory": "الفئة",

    "col.name": "الاسم",
    "col.org": "الجهة",
    "col.phone": "الهاتف",
    "col.wa": "واتساب",
    "col.category": "الفئة",
    "col.notes": "ملاحظات",
    "col.added": "أُضيف بواسطة",
    "col.actions": "إجراءات",

    "btn.add": "إضافة جهة اتصال",
    "btn.save": "حفظ",
    "btn.cancel": "إلغاء",
    "btn.delete": "حذف",
    "btn.edit": "تعديل",
    "btn.back": "رجوع",
    "btn.close": "إغلاق",

    "card.secondary": "رقم ثانٍ",
    "card.call": "اتصال",
    "card.whatsapp": "واتساب",
    "card.noWhatsapp": "بدون واتساب",
    "card.addedBy": "أُضيف بواسطة",
    "card.on": "في",
    "card.noNotes": "لا توجد ملاحظات",

    "empty.title": "لا توجد جهات اتصال بعد",
    "empty.body": "اضغط على زر + لإضافة أول جهة اتصال.",
    "empty.noResults": "لا توجد نتائج",
    "empty.noResultsBody": "جرّب تعديل البحث أو الفلاتر.",

    "form.addTitle": "إضافة جهة اتصال",
    "form.editTitle": "تعديل جهة الاتصال",
    "form.name": "الاسم",
    "form.namePlaceholder": "اسم الشخص",
    "form.org": "الجهة / المؤسسة",
    "form.orgPlaceholder": "اسم الجهة",
    "form.phone": "رقم الهاتف",
    "form.phonePlaceholder": "010xxxxxxxx",
    "form.phoneHint": "سنحول الرقم تلقائياً إلى صيغة دولية.",
    "form.phone2": "رقم ثانٍ (اختياري)",
    "form.phone2Placeholder": "011xxxxxxxx",
    "form.wa": "هل يوجد واتساب؟",
    "form.yes": "نعم",
    "form.no": "لا",
    "form.category": "الفئة",
    "form.categoryOther": "أخرى",
    "form.notes": "ملاحظات (اختياري)",
    "form.notesPlaceholder": "أي تفاصيل إضافية",
    "form.error.nameOrg": "من فضلك أدخل الاسم أو اسم الجهة.",
    "form.error.phone": "من فضلك أدخل رقم هاتف صحيح.",
    "form.error.waRequired": "من فضلك حدّد هل يوجد واتساب.",

    "dup.title": "هذا الرقم مسجّل بالفعل",
    "dup.body": "الرقم {phone} موجود بالفعل في جهة الاتصال: {name}.",

    "confirm.deleteTitle": "حذف جهة الاتصال؟",
    "confirm.deleteText": "سيتم حذف «{name}» نهائياً. لا يمكن التراجع عن هذا الإجراء.",
    "confirm.saveTitle": "الرقم مسجّل بالفعل",
    "confirm.saveText": "الرقم {phone} مستخدم في «{name}». هل تريد المتابعة والحفظ؟",

    "admin.title": "أدوات الإدارة",
    "admin.import": "استيراد",
    "admin.importDesc": "من ملف CSV أو Excel",
    "admin.export": "تصدير",
    "admin.exportDesc": "تصدير الكل CSV / Excel",
    "admin.cats": "إدارة الفئات",
    "admin.catsDesc": "إضافة أو تعديل الفئات",

    "import.title": "استيراد جهات الاتصال",
    "import.step1": "1. اختر الملف",
    "import.step2": "2. طابِق الأعمدة",
    "import.step3": "3. عاين واستورد",
    "import.choose": "اختر ملف CSV أو Excel",
    "import.chooseHint": "أو اسحبه وأفلته هنا",
    "import.sheetHint": "من ملف Excel، سنقرأ ورقة «Contacts» فقط إن وُجدت أكثر من ورقة.",
    "import.mappingTitle": "طابِق أعمدة الملف مع الحقول",
    "import.col.name": "الاسم",
    "import.col.organization": "الجهة",
    "import.col.phone": "الهاتف",
    "import.col.phone2": "رقم ثانٍ",
    "import.col.has_whatsapp": "واتساب",
    "import.col.category": "الفئة",
    "import.col.notes": "ملاحظات",
    "import.preview": "معاينة",
    "import.run": "استيراد",
    "import.skipDupes": "تخطّي الأرقام المكرّرة",
    "import.notMapped": "لم يتم الربط",
    "import.ignoreColumn": "تجاهل هذا العمود",
    "import.okCount": "سجلات صالحة",
    "import.dupCount": "أرقام مكرّرة",
    "import.sharedCount": "أرقام مشتركة مع جهة أخرى",
    "import.badCount": "أرقام غير صالحة",
    "import.error.empty": "الملف لا يحتوي على بيانات.",
    "import.error.parse": "تعذّرت قراءة الملف. تأكد أنه بصيغة CSV أو Excel صحيحة.",
    "import.error.noPhone": "يجب ربط عمود الهاتف على الأقل.",
    "import.done": "تم استيراد {count} جهة اتصال بنجاح.",
    "import.doneSkip": "تم استيراد {count} جهة اتصال، وتخطّي {skipped} مكرّر.",
    "import.row": "سطر",

    "export.title": "تصدير جهات الاتصال",
    "export.csv": "تصدير CSV",
    "export.csvDesc": "يعمل مع Excel و Google Sheets",
    "export.xlsx": "تصدير Excel",
    "export.xlsxDesc": "ملف .xlsx جاهز",
    "export.done": "تم تصدير {count} جهة اتصال.",

    "cat.title": "إدارة الفئات",
    "cat.add": "إضافة",
    "cat.newPlaceholder": "اسم فئة جديدة",
    "cat.rename": "تعديل الاسم",
    "cat.delete": "حذف",
    "cat.count": "{count} جهة",
    "cat.inUse": "مستخدمة في {count} جهة اتصال — عند حذفها ستصبح «أخرى».",
    "cat.deleted": "تم حذف الفئة «{name}».",

    "toast.added": "تمت إضافة جهة الاتصال.",
    "toast.updated": "تم تحديث جهة الاتصال.",
    "toast.deleted": "تم حذف جهة الاتصال.",
    "toast.duplicate": "الرقم مسجّل بالفعل.",
    "toast.saved": "تم الحفظ.",
    "toast.error": "حدث خطأ. حاول مرة أخرى.",
    "toast.imported": "تم استيراد {count} جهة اتصال.",

    "a11y.call": "اتصال بـ {name}",
    "a11y.whatsapp": "واتساب {name}",
    "a11y.edit": "تعديل {name}",
    "a11y.delete": "حذف {name}"
  },

  /* ================= ENGLISH ================= */
  en: {
    "app.title": "Wessal Contacts",
    "app.tagline": "Team directory",
    "role.admin": "Admin",
    "role.member": "Member",

    "auth.subtitle": "Sign in with your team account",
    "auth.username": "Username",
    "auth.usernamePlaceholder": "wessal",
    "auth.password": "Password",
    "auth.passwordPlaceholder": "••••••••",
    "auth.signIn": "Sign in",
    "auth.signingIn": "Signing in…",
    "auth.showPassword": "Show password",
    "auth.hidePassword": "Hide password",
    "auth.help": "Need an account? Ask your admin.",
    "auth.error.empty": "Please enter your username and password.",
    "auth.error.invalid": "Incorrect username or password.",
    "auth.error.network": "Could not reach the database. Check your internet and try again.",
    "auth.error.config": "The database is not configured yet. Please check config.js.",

    "header.role": "Role",
    "header.theme": "Toggle dark mode",
    "header.logout": "Log out",
    "header.adminTools": "Admin tools",
    "header.language": "العربية",

    "preview.banner": "Preview mode without a database — data is stored on this device only.",
    "preview.role": "Preview as",

    "search.placeholder": "Search name, organisation or number…",
    "search.clear": "Clear search",

    "stats.total": "Total",
    "stats.withWa": "With WhatsApp",
    "stats.withoutWa": "Without WhatsApp",

    "filters.all": "All",
    "filters.allCategories": "All categories",
    "filters.withWa": "With WhatsApp",
    "filters.withoutWa": "Without WhatsApp",
    "filters.whatsapp": "Filter by WhatsApp",
    "filters.category": "Filter by category",
    "filters.sort": "Sort",
    "filters.sortName": "Name (A-Z)",
    "filters.sortNewest": "Newest first",
    "filters.sortCategory": "Category",

    "col.name": "Name",
    "col.org": "Organisation",
    "col.phone": "Phone",
    "col.wa": "WhatsApp",
    "col.category": "Category",
    "col.notes": "Notes",
    "col.added": "Added by",
    "col.actions": "Actions",

    "btn.add": "Add contact",
    "btn.save": "Save",
    "btn.cancel": "Cancel",
    "btn.delete": "Delete",
    "btn.edit": "Edit",
    "btn.back": "Back",
    "btn.close": "Close",

    "card.secondary": "Second number",
    "card.call": "Call",
    "card.whatsapp": "WhatsApp",
    "card.noWhatsapp": "No WhatsApp",
    "card.addedBy": "Added by",
    "card.on": "on",
    "card.noNotes": "No notes",

    "empty.title": "No contacts yet",
    "empty.body": "Tap the + button to add your first contact.",
    "empty.noResults": "No results",
    "empty.noResultsBody": "Try adjusting your search or filters.",

    "form.addTitle": "Add contact",
    "form.editTitle": "Edit contact",
    "form.name": "Name",
    "form.namePlaceholder": "Person name",
    "form.org": "Organisation",
    "form.orgPlaceholder": "Organisation name",
    "form.phone": "Phone number",
    "form.phonePlaceholder": "010xxxxxxxx",
    "form.phoneHint": "We will convert it to international format automatically.",
    "form.phone2": "Second number (optional)",
    "form.phone2Placeholder": "011xxxxxxxx",
    "form.wa": "Has WhatsApp?",
    "form.yes": "Yes",
    "form.no": "No",
    "form.category": "Category",
    "form.categoryOther": "Other",
    "form.notes": "Notes (optional)",
    "form.notesPlaceholder": "Any extra details",
    "form.error.nameOrg": "Please enter a name or an organisation.",
    "form.error.phone": "Please enter a valid phone number.",
    "form.error.waRequired": "Please choose whether WhatsApp is available.",

    "dup.title": "This number already exists",
    "dup.body": "Number {phone} already belongs to: {name}.",

    "confirm.deleteTitle": "Delete contact?",
    "confirm.deleteText": "«{name}» will be permanently deleted. This cannot be undone.",
    "confirm.saveTitle": "Number already exists",
    "confirm.saveText": "Number {phone} is already used by «{name}». Save anyway?",

    "admin.title": "Admin tools",
    "admin.import": "Import",
    "admin.importDesc": "From a CSV or Excel file",
    "admin.export": "Export",
    "admin.exportDesc": "Export all as CSV / Excel",
    "admin.cats": "Categories",
    "admin.catsDesc": "Add or rename categories",

    "import.title": "Import contacts",
    "import.step1": "1. Choose file",
    "import.step2": "2. Match columns",
    "import.step3": "3. Preview & import",
    "import.choose": "Choose a CSV or Excel file",
    "import.chooseHint": "or drag and drop it here",
    "import.sheetHint": "From an Excel file we read the \"Contacts\" sheet only, if there is more than one sheet.",
    "import.mappingTitle": "Match file columns to fields",
    "import.col.name": "Name",
    "import.col.organization": "Organisation",
    "import.col.phone": "Phone",
    "import.col.phone2": "Second number",
    "import.col.has_whatsapp": "WhatsApp",
    "import.col.category": "Category",
    "import.col.notes": "Notes",
    "import.preview": "Preview",
    "import.run": "Import",
    "import.skipDupes": "Skip duplicate numbers",
    "import.notMapped": "Not mapped",
    "import.ignoreColumn": "Ignore this column",
    "import.okCount": "Valid rows",
    "import.dupCount": "Duplicate numbers",
    "import.sharedCount": "Numbers shared with another contact",
    "import.badCount": "Invalid numbers",
    "import.error.empty": "The file contains no data.",
    "import.error.parse": "Could not read the file. Make sure it is a valid CSV or Excel file.",
    "import.error.noPhone": "At least the phone column must be mapped.",
    "import.done": "Imported {count} contacts successfully.",
    "import.doneSkip": "Imported {count} contacts, skipped {skipped} duplicates.",
    "import.row": "Row",

    "export.title": "Export contacts",
    "export.csv": "Export CSV",
    "export.csvDesc": "Works with Excel and Google Sheets",
    "export.xlsx": "Export Excel",
    "export.xlsxDesc": "Ready-to-use .xlsx file",
    "export.done": "Exported {count} contacts.",

    "cat.title": "Manage categories",
    "cat.add": "Add",
    "cat.newPlaceholder": "New category name",
    "cat.rename": "Rename",
    "cat.delete": "Delete",
    "cat.count": "{count} contacts",
    "cat.inUse": "Used by {count} contacts — deleting it will move them to \"Other\".",
    "cat.deleted": "Category «{name}» deleted.",

    "toast.added": "Contact added.",
    "toast.updated": "Contact updated.",
    "toast.deleted": "Contact deleted.",
    "toast.duplicate": "That number already exists.",
    "toast.saved": "Saved.",
    "toast.error": "Something went wrong. Please try again.",
    "toast.imported": "Imported {count} contacts.",

    "a11y.call": "Call {name}",
    "a11y.whatsapp": "WhatsApp {name}",
    "a11y.edit": "Edit {name}",
    "a11y.delete": "Delete {name}"
  }
};

/* Tagline fix (kept explicit so both languages are correct) */
W.I18N.ar["app.tagline"] = "دليل فريق وِصال";

/* ---------------------------------------------------------------------
 * Translation helper
 * ------------------------------------------------------------------- */
W.t = function (key, vars) {
  var lang = W.lang || W.DEFAULT_LANG;
  var dict = W.I18N[lang] || W.I18N[W.DEFAULT_LANG];
  var out = dict[key];
  if (out === undefined) out = (W.I18N[W.DEFAULT_LANG] || {})[key];
  if (out === undefined) return key;
  if (vars) {
    out = out.replace(/\{(\w+)\}/g, function (m, name) {
      return vars[name] !== undefined ? vars[name] : m;
    });
  }
  return out;
};

/* Apply the current language to every [data-i18n*] element. */
W.applyTranslations = function (root) {
  var scope = root || document;
  scope.querySelectorAll("[data-i18n]").forEach(function (el) {
    el.textContent = W.t(el.getAttribute("data-i18n"));
  });
  scope.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
    el.setAttribute("placeholder", W.t(el.getAttribute("data-i18n-placeholder")));
  });
  scope.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
    el.setAttribute("aria-label", W.t(el.getAttribute("data-i18n-aria")));
  });
  scope.querySelectorAll("[data-i18n-title]").forEach(function (el) {
    el.setAttribute("title", W.t(el.getAttribute("data-i18n-title")));
  });
};

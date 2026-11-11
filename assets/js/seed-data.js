/* =====================================================================
 * Wessal Contacts — seed data
 * ---------------------------------------------------------------------
 * This is the initial content of the directory, taken from
 * wessal_contacts.xlsx -> sheet "Contacts" (17 rows).
 *
 * Notes on the source data (from the workbook's own "Read me" sheet):
 *   - Phone numbers were already stored as digits-only international
 *     format (Egypt = 20 + number without the leading 0).
 *   - Phone2 holds a second number; further numbers stay in Notes.
 *   - The 5-digit hotlines (e.g. 19466) are short codes: call-only,
 *     never a WhatsApp number. They are kept inside Notes.
 *   - One row (مؤسسة مصر الخير) has a 5-digit short code as its main
 *     number: 16140 — call only, no WhatsApp.
 *   - "WhatsApp = yes" was an assumption in the source file.
 *   - Two rows share numbers and were deliberately both kept:
 *       01002001661 / 0227770107 appear under
 *       "مؤسسة بنك خير مصر" and "مؤسسة بنك الخير للتنمية المستدامة".
 *     They are kept separate here (different main numbers), and the
 *     shared numbers are flagged for you during import.
 * ===================================================================== */
window.W = window.W || {};

W.DEFAULT_CATEGORIES = [
  "Client",
  "Organization",
  "Supplier",
  "Company",
  "Charity",
  "Other"
];

W.SEED_CONTACTS = [
  {
    name: "Mohamed Nour",
    organization: "V7",
    phone: "201002135438",
    phone_secondary: null,
    has_whatsapp: true,
    category: "Company",
    notes: "BD",
    created_by: "Abdo"
  },
  {
    name: "Mohanad Elbibany",
    organization: "Redbull",
    phone: "201275706666",
    phone_secondary: null,
    has_whatsapp: true,
    category: "Company",
    notes: "",
    created_by: "Abdo"
  },
  {
    name: "Marwa",
    organization: "Cocacola",
    phone: "201025595425",
    phone_secondary: null,
    has_whatsapp: true,
    category: "Company",
    notes: "",
    created_by: "Abdo"
  },
  {
    name: "Hussein Masry",
    organization: "Juhaina",
    phone: "201006725120",
    phone_secondary: null,
    has_whatsapp: true,
    category: "Company",
    notes: "COO",
    created_by: "Abdo"
  },
  {
    name: "Moataz El Nahass",
    organization: "Domty",
    phone: "201223417119",
    phone_secondary: null,
    has_whatsapp: true,
    category: "Company",
    notes: "",
    created_by: "Abdo"
  },
  {
    name: "",
    organization: "مؤسسة الزهراوان للتنمية المستدامة",
    phone: "201060070050",
    phone_secondary: null,
    has_whatsapp: true,
    category: "Charity",
    notes: "Booth clothes. Hotline: 19466",
    created_by: "Abdo"
  },
  {
    name: "",
    organization: "مؤسسة صناع الحياة",
    phone: "201050224979",
    phone_secondary: null,
    has_whatsapp: true,
    category: "Charity",
    notes: "Booth clothes. Hotline: 16563",
    created_by: "Abdo"
  },
  {
    name: "",
    organization: "مؤسسة إكرام للتنمية والأعمال الخيرية",
    phone: "201211114457",
    phone_secondary: "201286851185",
    has_whatsapp: true,
    category: "Charity",
    notes: "Booth clothes. Hotline: 17047",
    created_by: "Abdo"
  },
  {
    name: "",
    organization: "مؤسسة مصر الخير",
    phone: "16140",              /* 5-digit hotline -> call only */
    phone_secondary: null,
    has_whatsapp: false,
    category: "Charity",
    notes: "Booth clothes. Hotline only (5-digit short code, no country code)",
    created_by: "Abdo"
  },
  {
    name: "",
    organization: "جمعية الاورمان",
    phone: "201109922767",
    phone_secondary: null,
    has_whatsapp: true,
    category: "Charity",
    notes: "Booth clothes. Hotline: 19455",
    created_by: "Abdo"
  },
  {
    name: "",
    organization: "مؤسسة عمار الأرض",
    phone: "201001414863",
    phone_secondary: null,
    has_whatsapp: true,
    category: "Charity",
    notes: "Booth clothes. Hotline: 19054",
    created_by: "Abdo"
  },
  {
    name: "",
    organization: "مؤسسة اسمعونا",
    phone: "201204188881",
    phone_secondary: null,
    has_whatsapp: true,
    category: "Charity",
    notes: "Booth clothes. Hotline: 19748",
    created_by: "Abdo"
  },
  {
    name: "",
    organization: "مؤسسة بنك خير مصر",
    phone: "201092744194",
    phone_secondary: "201002001661",
    has_whatsapp: true,
    category: "Charity",
    notes: "Booth clothes. Other numbers: +20237616231, +20227770107. Same numbers also appear under 'مؤسسة بنك الخير للتنمية المستدامة'",
    created_by: "Abdo"
  },
  {
    name: "",
    organization: "مؤسسة شبرا الخير",
    phone: "201555503333",
    phone_secondary: "201220797677",
    has_whatsapp: true,
    category: "Charity",
    notes: "Booth clothes. Other number: +20244756100",
    created_by: "Abdo"
  },
  {
    name: "",
    organization: "مؤسسة بنك الخير للتنمية المستدامة",
    phone: "201002001661",
    phone_secondary: "20227770107",
    has_whatsapp: true,
    category: "Charity",
    notes: "Booth clothes. Same numbers also appear under 'مؤسسة بنك خير مصر'",
    created_by: "Abdo"
  },
  {
    name: "",
    organization: "مؤسسة نبض الحياة",
    phone: "201211114307",
    phone_secondary: null,
    has_whatsapp: true,
    category: "Charity",
    notes: "Booth clothes",
    created_by: "Abdo"
  },
  {
    name: "",
    organization: "مؤسسة خير للناس للتنمية والمساعدات الاجتماعية",
    phone: "201124446663",
    phone_secondary: "20237406980",
    has_whatsapp: true,
    category: "Charity",
    notes: "Booth clothes. Hotline: 17371. Other number: +2035447108",
    created_by: "Abdo"
  }
];

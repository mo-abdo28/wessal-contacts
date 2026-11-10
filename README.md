# Wessal Contacts · دليل جهات الاتصال

A bilingual (Arabic + English) team contacts directory with one-tap WhatsApp and
call buttons, backed by Supabase with database-level permissions.

دليل جهات الاتصال للفريق — بالعربية والإنجليزية، مع زر واتساب واتصال بضغطة واحدة،
ومدعوم بقاعدة بيانات Supabase مع صلاحيات مفعّلة داخل قاعدة البيانات نفسها.

---

## Quick start (البدء السريع)

```powershell
# Preview it locally (no database needed, uses the 17 sample contacts)
powershell -ExecutionPolicy Bypass -File serve.ps1 -Port 8080
# then open http://localhost:8080
```

To set it up for real, follow **[SETUP.md](SETUP.md)** — it walks you through
Supabase, the two logins, the import and the deployment, in plain language.

للإعداد الكامل، اتبع **[SETUP.md](SETUP.md)**.

---

## Features (المميزات)

- **Bilingual everywhere** — every label, button, message and placeholder exists in
  Arabic and English. The language toggle flips the entire layout between RTL and
  LTR, and the choice is remembered on the device.
- **One-tap actions** — green WhatsApp button (`https://wa.me/<number>`) shown only
  for contacts that have WhatsApp, plus a neutral Call button (`tel:+<number>`).
- **Smart number normalisation** — `01002135438` → `201002135438` automatically
  (Egypt `+20` by default). Numbers starting with `+` or `00` are treated as
  international. 5-digit hotlines stay untouched and never get a country code.
- **Arabic-aware search** — ignores diacritics and treats أ / إ / آ as ا, ة as ه,
  ى as ي. Arabic-Indic digits (٠١٢…) are converted, so `٠١٠٠٢١٣٥٤٣٨` finds the right row.
- **Duplicate protection** — warns when a number already exists and shows which
  contact holds it.
- **Import / export (admin)** — CSV and Excel, with column mapping and a preview
  before saving. Duplicate numbers are skipped, shared numbers are reported.
- **Live for the whole team** — Supabase Realtime, so changes appear on every phone.
- **Counters** — total, with WhatsApp, without WhatsApp, and per category.
- **Mobile first** — cards on phones, a table on desktop, large tap targets.

---

## The two accounts (الحسابات)

| Username | Password | Role | Permissions |
|----------|----------|------|-------------|
| `wessal` | member password (not published here) | Member | View, add, edit |
| `Abdo` | admin password (not published here) | Admin | All of the above + delete, import, export, categories |

> This repository is public, so the two passwords are deliberately **not** printed here.
> They live **only** in the Supabase auth service, stored hashed. They are
> never in the front-end code and never shown on any page. Sign-up, password reset
> and email verification are intentionally absent.

The username is mapped to a hidden email (`Abdo` → `abdo@wessal.app`) so Supabase's
built-in auth can be used without changing anything about it.

---

## Security model (نموذج الأمان)

Permissions are enforced by **Row Level Security** in Postgres, not by the UI:

| Table | Member | Admin | Not logged in |
|-------|--------|-------|---------------|
| `contacts` | select / insert / update | select / insert / update / **delete** | **nothing** |
| `categories` | select | select / insert / update / delete | **nothing** |
| `profiles` | own row only | all rows | **nothing** |

The `anon` role has no grants at all, so a visitor who is not logged in cannot read
or write any contact data — even if they craft their own API requests.

---

## Project layout (هيكل المشروع)

```
wessal-contacts/
├─ public/                  the deployable site (no build step)
│  ├─ index.html
│  ├─ config.js             ← Supabase URL + anon key go here
│  └─ assets/{css,js}/
├─ supabase/
│  ├─ 01_schema.sql         tables + RLS + realtime
│  ├─ 02_create_accounts.sql the two logins (kept out of git — contains passwords)
│  ├─ 03_seed_contacts.sql   the 17 contacts
│  └─ wessal_contacts.csv    ready-made import file
├─ netlify.toml / vercel.json
├─ serve.ps1                 local preview server
├─ SETUP.md                  step-by-step guide (AR + EN)
└─ README.md
```

---

## Tech notes (ملاحظات تقنية)

- **No build step.** Plain HTML, CSS and JavaScript — no npm, no bundler, no
  framework. Deploy by uploading the `public` folder. This keeps hosting free,
  instant and dependency-free.
- **Vanilla JS with the `W` global namespace**, one file per concern, commented in
  English.
- **Supabase JS v2** loaded from a CDN on demand; **SheetJS** loaded on demand only
  when an `.xlsx` file is imported.
- **Offline preview mode** — with no credentials in `config.js` the app runs
  entirely in the browser with the sample data, so you can look around before
  touching Supabase.

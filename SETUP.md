# Wessal Contacts — Setup Guide
# دليل إعداد «دليل جهات الاتصال»

> A step-by-step guide for someone who has never used Supabase before.
> كل خطوة مشروحة ببساطة — لا تحتاج أي خبرة برمجية.

---

## What you will do — ملخص سريع

| # | Step | Time |
|---|------|------|
| 1 | Create a free Supabase project | 2 min |
| 2 | Run the database script (tables + security) | 2 min |
| 3 | Create the two logins | 1 min |
| 4 | Put your project URL + key into `config.js` | 1 min |
| 5 | Import your contacts | 1 min |
| 6 | Put the site online (Netlify / Vercel) | 3 min |

**Total: about 10 minutes.** The database is free for small teams.

---

## Step 1 — Create the Supabase project (المشروع)

1. Go to **https://supabase.com** and click **Start new project**.
2. Fill in:
   - **Organization**: `Wessal` (anything)
   - **Project name**: `wessal-contacts`
   - **Database Password**: invent a strong password and **save it somewhere safe** (you will need it)
   - **Region**: pick the one closest to Egypt — **Europe (Frankfurt)** or **Mumbai**
3. Click **Create new project** and wait ~1 minute.

### Turn off email sign-ups (مهم)

Supabase normally lets anybody create an account. We only want our two logins.

1. In the left menu click the **gear icon** ⚙️ → **Authentication**
2. Click **Users** → **Enable email sign-ups** → turn it **OFF**
3. Still in **Authentication**, click **Email** and make sure **Confirm email** is turned **OFF**

That stops anyone else from registering, and stops Supabase sending confirmation emails to the fake addresses.

---

## Step 2 — Create the tables and the security rules (الجداول والأمان)

1. In the left menu click **SQL Editor** → **New query**
2. Open the file `supabase/01_schema.sql` from this project, copy **all** of it, and paste it into the editor
3. Click **Run** (or press Ctrl+Enter)
4. You should see a green **"Success. No rows returned"** message. That is correct.

This created three tables — `contacts`, `categories`, `profiles` — and switched on **Row Level Security**, which is what stops logged-out visitors from reading or changing anything.

---

## Step 2b — Approvals and the activity log (الموافقات وسجل النشاط)

1. **SQL Editor** → **New query**
2. Open `supabase/04_activity.sql`, copy **all** of it, paste it, click **Run**
3. You should see two counts at the bottom (`change_requests` and `activity_log`). Both `0` is correct.

This file is **additive** — it never drops your contacts, so it is safe to run now and safe to run again later.

It adds:

- **`change_requests`** — when a member edits a contact, the change is *not* applied straight away. It waits here until you approve it.
- **`activity_log`** — a permanent record of every change (add, edit, delete, approve, reject), written by the database itself so it cannot be skipped.
- It also tightens the rules on `contacts`: from now on **only an admin can change a contact directly**. Members edit by sending you a request.

Without this file the app still works — members simply edit directly, as before.

---

## Step 3 — Create the two accounts (الحسابات)

### Option A — The easy way (recommended for non-developers)

1. Supabase dashboard → **Authentication** → **Users** → **Add user** → **Add new user**
2. Fill in the **first** account:
   - **Email**: `wessal@wessal.app`
   - **Password**: the member password (see the table below)
   - Tick **Auto Confirm User**
   - Click **Create user**
3. Do the same for the **second** account:
   - **Email**: `abdo@wessal.app`
   - **Password**: the admin password (see the table below)
   - Tick **Auto Confirm User**
   - Click **Create user**

### Option B — Run the script (faster)

`supabase/02_create_accounts.sql` creates both accounts in one go. It contains the two
passwords as plain text, so it is **not published in this public repository** — keep it in
your private copy of the project.

1. Open `supabase/02_create_accounts.sql` from your private copy
2. Paste it into the **SQL Editor** and click **Run**
3. It creates both accounts with the passwords already hashed by Postgres

Either way you end up with the same two logins:

| Username | Password | Can do |
|----------|----------|--------|
| `wessal` | the member password shared with the team | View, add and edit contacts |
| `Abdo` | the admin password | Everything, including delete, import/export and categories |

> ⚠️ **This guide is in a public repository, so the two passwords are not printed here.**
> Get them from the team handover message (or from the private copy of the project).
> The passwords still live **only** in Supabase's auth service, stored hashed.

> **How it works:** the site turns the username into a hidden email address
> (`Abdo` → `abdo@wessal.app`) so Supabase's login system can be used as-is.
> The team only ever types a username and a password.
> **The passwords are stored hashed** inside Supabase — they are never written in the website code, and they never appear on any page.

### Give the admin its extra powers

Run this once in the SQL Editor (safe to run again):

```sql
update public.profiles set role = 'admin' where username = 'Abdo';
update public.profiles set role = 'member' where username = 'wessal';
```

---

## Step 4 — Tell the website where your database is (الإعدادات)

1. Supabase dashboard → **Settings** → **API**
2. Copy the **Project URL** — it looks like `https://abcdefghijklm.supabase.co`
3. Copy the **anon public** key — the long `eyJhbGci...` string.
   ⚠️ Do **not** use the `service_role` key. That one is the master key and must never go into a website.
4. Open `public/config.js` in this project and paste them in:

```js
window.WESSAL_CONFIG = {
  SUPABASE_URL: "https://abcdefghijklm.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....",
  DEFAULT_COUNTRY_CODE: "20",
  AUTH_EMAIL_DOMAIN: "wessal.app"
};
```

5. Save the file.

---

## Step 5 — Import your contacts (استيراد جهات الاتصال)

You have **two** ways. Pick either.

### Option A — Through the website (recommended)

1. Open the site and sign in as `Abdo` with the admin password
2. Tap the **shield icon** in the header → **Import (استيراد)**
3. Choose your file `wessal_contacts.xlsx` (or `supabase/wessal_contacts.csv`)
4. The app reads the **"Contacts"** sheet only, and matches the columns automatically
5. Tap **Preview (معاينة)** — you will see:

   | Counter | Meaning |
   |---------|---------|
   | **Valid rows** | Rows that will be added |
   | **Duplicate numbers** | Rows skipped because the main number already exists |
   | **Invalid numbers** | Rows skipped because the number is not valid |
   | **Numbers shared with another contact** | Rows kept, but the number is also used by somebody else |

6. Tick **"Skip duplicate numbers"** (it is on by default) and tap **Import (استيراد)**
7. A message appears saying how many were imported

### Option B — Through SQL

1. Open `supabase/03_seed_contacts.sql`
2. Paste it into the **SQL Editor** and click **Run**

---

## Step 6 — Put the website online (النشر)

The site has **no build step** — it is plain HTML/CSS/JS. So publishing is just uploading a folder.

### Netlify (easiest)

1. Go to **https://app.netlify.com/drop**
2. Drag the **`public` folder** from this project onto the page
3. Done — you get a URL like `https://wonderful-name-1234.netlify.app`

To change it later, open the site's **Site configuration → Domain management**.

> **Important for Netlify + Supabase:** Supabase may block requests from unknown
> origins. Go to Supabase → **Authentication → URL Configuration** and add your
> site address to **Redirect URLs / Site URL**, e.g.
> `https://wonderful-name-1234.netlify.app`.
> (If you skip this, the login screen will show an error even though the
> username and password are right.)

### Vercel

1. Go to **https://vercel.com** → **Add New** → **Project**
2. Import this folder (or connect the Git repo)
3. Settings → **Framework Preset**: **Other**
4. **Build Command**: leave empty · **Output Directory**: `public`
5. Click **Deploy**
6. Add the Vercel URL to Supabase → **Authentication → URL Configuration** (same as above)

### Any other host

Upload the contents of the **`public`** folder to the web root of your host.
Make sure `index.html` is at the root.

---

## Step 7 — Check it works (التأكد)

1. Open the site on your **phone**
2. Sign in as `wessal` with the member password
3. Check you can see the contacts but **no** shield icon and **no** red Delete buttons
4. Sign out, sign in as `Abdo` with the admin password
5. Now the shield icon and Delete buttons appear
6. Tap a green **WhatsApp** button → WhatsApp opens with the number ready
7. Tap a grey **Call** button → the dialler opens
8. Tap **EN / ع** in the header → the whole page flips to Arabic (right-to-left) or English

---

## Common questions (أسئلة شائعة)

**"Login says incorrect username or password."**
Make sure the email in Supabase is exactly `wessal@wessal.app` and `abdo@wessal.app`
(all lowercase). The username you type can be any case (`Abdo` or `abdo` both work).

**"Login shows a 'network' or 'fetch' error."**
Add your site address to Supabase → **Authentication → URL Configuration**.

**"I forgot which password I used."**
Delete the account in Supabase → **Authentication → Users**, then create it again
with the same password. There is no "forgot password" by design.

**"Someone could read the contacts without logging in."**
They cannot. Row Level Security is enabled and the `anon` role has no access at all.
You can verify: open a new private/incognito window, open the site, and try to log in —
there is no data on screen before logging in.

**"Can I add more team members later?"**
Yes — create a new row in `public.profiles` with `role = 'member'` and give the person
their own username and password in Supabase. (This is only needed if the team grows.)

**"How do I change the default country code?"**
In `public/config.js`, change `DEFAULT_COUNTRY_CODE` (currently `"20"` for Egypt).

---

## File map (ملفات المشروع)

```
wessal-contacts/
├─ public/                     ← THIS is the folder you upload
│  ├─ index.html               the whole page
│  ├─ config.js                ← put your Supabase URL + key here
│  └─ assets/
│     ├─ css/styles.css        all styling, light + dark
│     └─ js/
│        ├─ i18n.js            every Arabic/English string
│        ├─ normalize.js       phone + Arabic search rules
│        ├─ seed-data.js       the 17 starting contacts
│        ├─ db.js              Supabase connection (+ offline preview)
│        ├─ store.js           app state, roles, save/delete
│        ├─ io.js              CSV/Excel import + export
│        ├─ ui.js              cards, table, counters
│        └─ app.js             login, forms, buttons
├─ supabase/
│  ├─ 01_schema.sql            ← run this first
│  ├─ 02_create_accounts.sql   ← the two accounts (private copy only)
│  ├─ 03_seed_contacts.sql     ← the 17 contacts (optional)
│  ├─ 04_activity.sql          ← approvals + activity log (run this too)
│  └─ wessal_contacts.csv      ← ready-made import file
├─ netlify.toml                Netlify settings
├─ vercel.json                 Vercel settings
└─ serve.ps1                   optional: preview on your own computer
```

---

## Previewing without a database (معاينة بدون قاعدة بيانات)

Open `public/index.html` directly, or run the included server:

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1 -Port 8080
```

Then visit `http://localhost:8080`. The app runs with the sample data stored in
that browser only. Add `?empty=1` to the address to start with an empty list.

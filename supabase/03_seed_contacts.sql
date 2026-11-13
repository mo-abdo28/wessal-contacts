-- =====================================================================
-- Wessal Contacts — import the starting contacts
-- ---------------------------------------------------------------------
-- Run this ONCE in your Supabase project:
--   Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
--
-- It loads the 17 contacts from wessal_contacts.xlsx (sheet "Contacts")
-- into public.contacts.
--
-- It is safe to run more than once: each contact is only added when the
-- same organisation + phone is not already in the table.
--
-- ALTERNATIVE (recommended, no SQL needed):
--   Sign in as the admin, open Admin tools -> Import, and choose your
--   wessal_contacts.xlsx file. The app reads the "Contacts" sheet,
--   auto-matches the columns, shows a preview and skips duplicates.
--
-- Notes:
--   * Numbers are stored as digits only, international format, no "+".
--   * 16140 is a 5-digit hotline (short code): call only, no WhatsApp.
--   * Two rows intentionally share numbers with each other (banking
--     foundation / khair مصر) — both are kept, exactly as in the
--     source file.
--
-- NOTE ON FORMATTING: every opening parenthesis is closed on the SAME
-- line, so the script can be pasted into any SQL editor without an
-- auto-closing bracket leaving a stray ")" behind.
-- =====================================================================

insert into public.contacts (name, organization, phone, phone_secondary, has_whatsapp, category, notes, created_by_name, created_at) select 'Mohamed Nour', 'V7', '201002135438', null, true, 'Company', 'BD', 'Abdo', now() where not exists (select 1 from public.contacts c where c.organization = 'V7' and c.phone = '201002135438');
insert into public.contacts (name, organization, phone, phone_secondary, has_whatsapp, category, notes, created_by_name, created_at) select 'Mohanad Elbibany', 'Redbull', '201275706666', null, true, 'Company', '', 'Abdo', now() where not exists (select 1 from public.contacts c where c.organization = 'Redbull' and c.phone = '201275706666');
insert into public.contacts (name, organization, phone, phone_secondary, has_whatsapp, category, notes, created_by_name, created_at) select 'Marwa', 'Cocacola', '201025595425', null, true, 'Company', '', 'Abdo', now() where not exists (select 1 from public.contacts c where c.organization = 'Cocacola' and c.phone = '201025595425');
insert into public.contacts (name, organization, phone, phone_secondary, has_whatsapp, category, notes, created_by_name, created_at) select 'Hussein Masry', 'Juhaina', '201006725120', null, true, 'Company', 'COO', 'Abdo', now() where not exists (select 1 from public.contacts c where c.organization = 'Juhaina' and c.phone = '201006725120');
insert into public.contacts (name, organization, phone, phone_secondary, has_whatsapp, category, notes, created_by_name, created_at) select 'Moataz El Nahass', 'Domty', '201223417119', null, true, 'Company', '', 'Abdo', now() where not exists (select 1 from public.contacts c where c.organization = 'Domty' and c.phone = '201223417119');
insert into public.contacts (name, organization, phone, phone_secondary, has_whatsapp, category, notes, created_by_name, created_at) select '', 'مؤسسة الزهراوان للتنمية المستدامة', '201060070050', null, true, 'Charity', 'Booth clothes. Hotline: 19466', 'Abdo', now() where not exists (select 1 from public.contacts c where c.organization = 'مؤسسة الزهراوان للتنمية المستدامة' and c.phone = '201060070050');
insert into public.contacts (name, organization, phone, phone_secondary, has_whatsapp, category, notes, created_by_name, created_at) select '', 'مؤسسة صناع الحياة', '201050224979', null, true, 'Charity', 'Booth clothes. Hotline: 16563', 'Abdo', now() where not exists (select 1 from public.contacts c where c.organization = 'مؤسسة صناع الحياة' and c.phone = '201050224979');
insert into public.contacts (name, organization, phone, phone_secondary, has_whatsapp, category, notes, created_by_name, created_at) select '', 'مؤسسة إكرام للتنمية والأعمال الخيرية', '201211114457', '201286851185', true, 'Charity', 'Booth clothes. Hotline: 17047', 'Abdo', now() where not exists (select 1 from public.contacts c where c.organization = 'مؤسسة إكرام للتنمية والأعمال الخيرية' and c.phone = '201211114457');
insert into public.contacts (name, organization, phone, phone_secondary, has_whatsapp, category, notes, created_by_name, created_at) select '', 'مؤسسة مصر الخير', '16140', null, false, 'Charity', 'Booth clothes. Hotline only (5-digit short code, no country code)', 'Abdo', now() where not exists (select 1 from public.contacts c where c.organization = 'مؤسسة مصر الخير' and c.phone = '16140');
insert into public.contacts (name, organization, phone, phone_secondary, has_whatsapp, category, notes, created_by_name, created_at) select '', 'جمعية الاورمان', '201109922767', null, true, 'Charity', 'Booth clothes. Hotline: 19455', 'Abdo', now() where not exists (select 1 from public.contacts c where c.organization = 'جمعية الاورمان' and c.phone = '201109922767');
insert into public.contacts (name, organization, phone, phone_secondary, has_whatsapp, category, notes, created_by_name, created_at) select '', 'مؤسسة عمار الأرض', '201001414863', null, true, 'Charity', 'Booth clothes. Hotline: 19054', 'Abdo', now() where not exists (select 1 from public.contacts c where c.organization = 'مؤسسة عمار الأرض' and c.phone = '201001414863');
insert into public.contacts (name, organization, phone, phone_secondary, has_whatsapp, category, notes, created_by_name, created_at) select '', 'مؤسسة اسمعونا', '201204188881', null, true, 'Charity', 'Booth clothes. Hotline: 19748', 'Abdo', now() where not exists (select 1 from public.contacts c where c.organization = 'مؤسسة اسمعونا' and c.phone = '201204188881');
insert into public.contacts (name, organization, phone, phone_secondary, has_whatsapp, category, notes, created_by_name, created_at) select '', 'مؤسسة بنك خير مصر', '201092744194', '201002001661', true, 'Charity', 'Booth clothes. Other numbers: +20237616231, +20227770107', 'Abdo', now() where not exists (select 1 from public.contacts c where c.organization = 'مؤسسة بنك خير مصر' and c.phone = '201092744194');
insert into public.contacts (name, organization, phone, phone_secondary, has_whatsapp, category, notes, created_by_name, created_at) select '', 'مؤسسة شبرا الخير', '201555503333', '201220797677', true, 'Charity', 'Booth clothes. Other number: +20244756100', 'Abdo', now() where not exists (select 1 from public.contacts c where c.organization = 'مؤسسة شبرا الخير' and c.phone = '201555503333');
insert into public.contacts (name, organization, phone, phone_secondary, has_whatsapp, category, notes, created_by_name, created_at) select '', 'مؤسسة بنك الخير للتنمية المستدامة', '201002001661', '20227770107', true, 'Charity', 'Booth clothes', 'Abdo', now() where not exists (select 1 from public.contacts c where c.organization = 'مؤسسة بنك الخير للتنمية المستدامة' and c.phone = '201002001661');
insert into public.contacts (name, organization, phone, phone_secondary, has_whatsapp, category, notes, created_by_name, created_at) select '', 'مؤسسة نبض الحياة', '201211114307', null, true, 'Charity', 'Booth clothes', 'Abdo', now() where not exists (select 1 from public.contacts c where c.organization = 'مؤسسة نبض الحياة' and c.phone = '201211114307');
insert into public.contacts (name, organization, phone, phone_secondary, has_whatsapp, category, notes, created_by_name, created_at) select '', 'مؤسسة خير للناس للتنمية والمساعدات الاجتماعية', '201124446663', '20237406980', true, 'Charity', 'Booth clothes. Hotline: 17371. Other number: +2035447108', 'Abdo', now() where not exists (select 1 from public.contacts c where c.organization = 'مؤسسة خير للناس للتنمية والمساعدات الاجتماعية' and c.phone = '201124446663');

-- ---------------------------------------------------------------------
-- Show the result
-- ---------------------------------------------------------------------
select count(*) as total_contacts, count(*) filter (where has_whatsapp) as with_whatsapp, count(*) filter (where not has_whatsapp) as without_whatsapp from public.contacts;

select category, count(*) as n from public.contacts group by category order by n desc;

-- =====================================================================
-- Wessal Contacts — import the starting contacts
-- ---------------------------------------------------------------------
-- Run this ONCE in your Supabase project:
--   Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
--
-- It loads the 17 contacts from wessal_contacts.xlsx (sheet "Contacts")
-- into public.contacts.
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
-- =====================================================================

insert into public.contacts
  (name, organization, phone, phone_secondary, has_whatsapp, category, notes, created_by_name, created_at)
values
  ('Mohamed Nour',   'V7',                '201002135438', null,        true,  'Company', 'BD', 'Abdo', now()),
  ('Mohanad Elbibany','Redbull',          '201275706666', null,        true,  'Company', '',    'Abdo', now()),
  ('Marwa',          'Cocacola',          '201025595425', null,        true,  'Company', '',    'Abdo', now()),
  ('Hussein Masry',  'Juhaina',           '201006725120', null,        true,  'Company', 'COO', 'Abdo', now()),
  ('Moataz El Nahass','Domty',            '201223417119', null,        true,  'Company', '',    'Abdo', now()),
  ('', 'مؤسسة الزهراوان للتنمية المستدامة',        '201060070050', null,        true,  'Charity', 'Booth clothes. Hotline: 19466', 'Abdo', now()),
  ('', 'مؤسسة صناع الحياة',                          '201050224979', null,        true,  'Charity', 'Booth clothes. Hotline: 16563', 'Abdo', now()),
  ('', 'مؤسسة إكرام للتنمية والأعمال الخيرية',      '201211114457', '201286851185', true, 'Charity', 'Booth clothes. Hotline: 17047', 'Abdo', now()),
  ('', 'مؤسسة مصر الخير',                            '16140',        null,        false, 'Charity', 'Booth clothes. Hotline only (5-digit short code, no country code)', 'Abdo', now()),
  ('', 'جمعية الاورمان',                             '201109922767', null,        true,  'Charity', 'Booth clothes. Hotline: 19455', 'Abdo', now()),
  ('', 'مؤسسة عمار الأرض',                           '201001414863', null,        true,  'Charity', 'Booth clothes. Hotline: 19054', 'Abdo', now()),
  ('', 'مؤسسة اسمعونا',                              '201204188881', null,        true,  'Charity', 'Booth clothes. Hotline: 19748', 'Abdo', now()),
  ('', 'مؤسسة بنك خير مصر',                          '201092744194', '201002001661', true, 'Charity', 'Booth clothes. Other numbers: +20237616231, +20227770107. Same numbers also appear under ''مؤسسة بنك الخير للتنمية المستدامة''', 'Abdo', now()),
  ('', 'مؤسسة شبرا الخير',                           '201555503333', '201220797677', true, 'Charity', 'Booth clothes. Other number: +20244756100', 'Abdo', now()),
  ('', 'مؤسسة بنك الخير للتنمية المستدامة',        '201002001661', '20227770107', true,  'Charity', 'Booth clothes. Same numbers also appear under ''مؤسسة بنك خير مصر''', 'Abdo', now()),
  ('', 'مؤسسة نبض الحياة',                           '201211114307', null,        true,  'Charity', 'Booth clothes', 'Abdo', now()),
  ('', 'مؤسسة خير للناس للتنمية والمساعدات الاجتماعية','201124446663','20237406980', true,  'Charity', 'Booth clothes. Hotline: 17371. Other number: +2035447108', 'Abdo', now())
on conflict do nothing;

-- ---------------------------------------------------------------------
-- Show the result
-- ---------------------------------------------------------------------
select count(*) as total_contacts,
       count(*) filter (where has_whatsapp) as with_whatsapp,
       count(*) filter (where not has_whatsapp) as without_whatsapp
from public.contacts;

select category, count(*) as n
from public.contacts
group by category
order by n desc;

/* =====================================================================
 * Wessal Contacts — configuration
 * ---------------------------------------------------------------------
 * THIS IS THE ONLY FILE YOU NEED TO EDIT FOR THE BACKEND.
 *
 * 1. Open your Supabase project -> Settings -> API
 * 2. Copy "Project URL"      -> put it in SUPABASE_URL
 * 3. Copy the "anon public" key -> put it in SUPABASE_ANON_KEY
 *    (the long "eyJ..." key, NOT the service_role key)
 * 4. Save this file and redeploy.
 *
 * Leave both values EMPTY to run in "preview mode": the app works fully
 * with sample data stored in this browser only (no account needed).
 *
 * SECURITY: the key below is the PUBLIC "anon" key. It is designed to be
 * shipped in a browser — every permission is enforced by Row Level
 * Security inside the database. Never put the service_role / secret key
 * here: that one can bypass the permissions.
 * ===================================================================== */
window.WESSAL_CONFIG = {
  // The Supabase project URL.
  SUPABASE_URL: "https://gmpmbvpojxmttfhkuqgc.supabase.co",

  // The public "anon" key (safe to publish — the database still enforces
  // who may read and change what).
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtcG1idnBvanhtdHRmaGt1cWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0MzEyNDYsImV4cCI6MjExMDAwNzI0Nn0.3pip0OA3Zw91j_is7qpHU7DhS2amdLo3HcInRu6Bfks",

  // Default country code used when normalising local phone numbers.
  DEFAULT_COUNTRY_CODE: "20",

  // Domain used to turn a username into a login email
  // (username "Abdo" -> "abdo@wessal.app")
  AUTH_EMAIL_DOMAIN: "wessal.app",

  // What to do when the two values above are still EMPTY:
  //   "auto"   - open for preview on your own computer (localhost or a
  //              file you double-clicked), LOCKED everywhere else.
  //   "open"   - always show the offline preview with sample data.
  //   "locked" - always show the login screen only.
  // "auto" is what keeps a published site safe: visitors on the public
  // URL see the sign-in screen and nothing else.
  PREVIEW_MODE: "auto"
};

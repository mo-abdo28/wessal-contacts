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
 * ===================================================================== */
window.WESSAL_CONFIG = {
  // Example: "https://abcdefghijklm.supabase.co"
  SUPABASE_URL: "",

  // Example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...."
  SUPABASE_ANON_KEY: "",

  // Default country code used when normalising local phone numbers.
  DEFAULT_COUNTRY_CODE: "20",

  // Domain used to turn a username into a login email
  // (username "Abdo" -> "abdo@wessal.app")
  AUTH_EMAIL_DOMAIN: "wessal.app"
};

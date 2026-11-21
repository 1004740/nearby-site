// Settings for the site. Safe to publish: the anon key only lets the public add a waitlist sign-up.
// Leave a value empty and the forms say sign-ups aren't open yet.
// The Pages Functions (story pages) read this file too, unless SITE_URL, SUPABASE_URL or SUPABASE_ANON_KEY are set as Pages environment variables.
window.DB_CONFIG = {
  SITE_URL: "https://dearborough.london", // placeholder until the domain is bought
  supabaseUrl: "",       // e.g. "https://abcdefgh.supabase.co"
  supabaseAnonKey: "",   // the "anon public" key
  turnstileSiteKey: ""   // Cloudflare Turnstile site key (public)
};

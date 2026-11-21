// The security headers from /_headers, for responses made by Pages Functions (story pages). Cloudflare Pages applies
// _headers to static files only, so Function responses must carry them themselves. test/headers.test.js fails if this
// list and _headers drift apart.
export const SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self' https://*.supabase.co https://challenges.cloudflare.com; img-src 'self' data:; style-src 'self'; base-uri 'none'; form-action 'self' https://*.supabase.co; frame-ancestors 'none'; object-src 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=31536000",
};

/** A copy of a response with the security headers added (any it already has are kept). */
export function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) if (!headers.has(k)) headers.set(k, v);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

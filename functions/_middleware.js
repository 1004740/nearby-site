// Runs for every Pages Function route (/s, /c, /e): adds the security headers to the response, including error pages
// and anything a route forgot. Static files get theirs from /_headers.
import { withSecurityHeaders } from "./_lib/headers.js";

export async function onRequest(context) {
  try {
    return withSecurityHeaders(await context.next());
  } catch (e) {
    return withSecurityHeaders(new Response("Something went wrong. Please try again.", { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } }));
  }
}

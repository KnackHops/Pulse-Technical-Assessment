import { NextResponse, type NextRequest } from "next/server";

// Security headers for every response, plus a same-origin guard on the API.
// CSP uses a per-request nonce (Next auto-applies it to its own bootstrap
// scripts when it sees the CSP on the request headers; Mapbox loads as a nonced
// chunk and is trusted via 'strict-dynamic'). style-src allows 'unsafe-inline'
// because motion writes inline styles; mapbox-gl needs blob workers + its API
// hosts. Dev adds 'unsafe-eval' + ws: so Fast Refresh / HMR keep working.
export function middleware(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";

  // Same-origin API guard: a cross-site POST carries an Origin that won't match
  // our host. Same-origin fetches (and sendBeacon) match it or omit it; block
  // the mismatch before it reaches a route.
  if (request.nextUrl.pathname.startsWith("/api")) {
    const origin = request.headers.get("origin");
    if (origin) {
      let bad = true;
      try {
        bad = new URL(origin).host !== request.headers.get("host");
      } catch {
        bad = true;
      }
      if (bad) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }
  }

  const nonce = crypto.randomUUID();

  const scriptSrc = isDev
    ? `'self' 'nonce-${nonce}' 'unsafe-eval' 'strict-dynamic'`
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`;
  const connectSrc = isDev
    ? `'self' https://*.mapbox.com https://*.tiles.mapbox.com ws: wss:`
    : `'self' https://*.mapbox.com https://*.tiles.mapbox.com`;

  const csp = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https://*.mapbox.com`,
    `worker-src 'self' blob:`,
    `child-src 'self' blob:`,
    `connect-src ${connectSrc}`,
    `font-src 'self' data:`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
  ].join("; ");

  // Next reads the nonce from the CSP on the *request* headers to nonce its own
  // scripts; x-nonce is what our inline theme script reads in the layout.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("content-security-policy", csp);
  requestHeaders.set("x-nonce", nonce);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "no-referrer");
  res.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(self), geolocation=(self)",
  );
  if (!isDev) {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
  return res;
}

export const config = {
  // Run on everything except static assets (the HTML document is what matters).
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

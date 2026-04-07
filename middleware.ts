import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { getSiteBaseUrl } from "@/lib/site-url";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const host = request.nextUrl.hostname.toLowerCase();

  if (host.endsWith(".vercel.app")) {
    const canonicalBase = new URL(getSiteBaseUrl());
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.protocol = canonicalBase.protocol;
    redirectUrl.host = canonicalBase.host;
    return NextResponse.redirect(redirectUrl, 308);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};

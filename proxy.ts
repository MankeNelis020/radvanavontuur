import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["en", "nl"] as const;
type Locale = (typeof locales)[number];

function isLocale(value: string): value is Locale {
  return value === "en" || value === "nl";
}

function preferLocale(header: string): Locale {
  const tags = header.split(",").map((part) => part.trim().split(";")[0]?.toLowerCase() ?? "");
  for (const tag of tags) {
    if (tag.startsWith("nl")) return "nl";
    if (tag.startsWith("en")) return "en";
  }
  return "en";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segment = pathname.split("/")[1] ?? "";

  if (isLocale(segment)) {
    const headers = new Headers(request.headers);
    headers.set("x-locale", segment);
    headers.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers } });
  }

  const locale = preferLocale(request.headers.get("accept-language") ?? "");
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|brand/|.*\\..*).*)"],
};

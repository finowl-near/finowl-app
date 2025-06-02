import { NextResponse } from "next/server";

export function middleware(request) {
  const nearAccount = request.cookies.get("nearAccount")?.value;
  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/mindshare", request.url));
  }
  if (nearAccount && request.nextUrl.pathname === "/chat") {
    return NextResponse.next();
  }
  if (!nearAccount && request.nextUrl.pathname === "/chat") {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/mindshare", "/chat"]
};

import { NextResponse } from "next/server";

export function middleware(request) {
  const nearAccount = request.cookies.get("nearAccount")?.value;
  console.log("infinit");
  if (!nearAccount && request.nextUrl.pathname !== "/") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (
    nearAccount &&
    (request.nextUrl.pathname === "/" ||
      request.nextUrl.pathname === "/onboarding")
  ) {
    console.log("entered here");
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  console.log("reques here", request.url, nearAccount);
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard", "/chat"],
};

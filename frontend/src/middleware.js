import { NextResponse } from "next/server";

export function middleware(request) {
  const nearAccount = request.cookies.get("nearAccount")?.value;
  console.log("infinit");
  if (request.nextUrl.pathname === "/") {
    console.log("entered here 1", request.url, nearAccount);
    return NextResponse.redirect(new URL("/mindshare", request.url));
  }
  if (nearAccount && request.nextUrl.pathname === "/chat") {
    console.log("entered here 2", request.url, nearAccount);
    return NextResponse.next();
  }
  if (!nearAccount && request.nextUrl.pathname === "/chat") {
    console.log("entered here 3", request.url, nearAccount);
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }
  console.log("entered here 4", request.url, nearAccount);
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/mindshare", "/chat"]
};

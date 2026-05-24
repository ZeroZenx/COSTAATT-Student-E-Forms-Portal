import { NextResponse } from "next/server";
import { COOKIE_NAME, createSsoToken } from "@/lib/auth";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production." }, { status: 404 });
  }

  const token = createSsoToken({
    studentId: "00012345",
    firstName: "Darren",
    lastName: "Headley",
    email: "darren.headley@student.costaatt.edu.tt",
    roles: ["student", "registry"]
  });

  const response = NextResponse.redirect(new URL("/forms", request.url));
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });
  return response;
}

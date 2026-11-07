import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminToken, cookieOptions } from "../../../../lib/admin-session";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { code } = await request.json();
    const expected = process.env.ADMIN_PASSCODE;
    if (!expected || typeof code !== "string" || code.length !== expected.length) {
      return NextResponse.json({ error: "رمز الدخول غير صحيح" }, { status: 401 });
    }
    const { timingSafeEqual } = await import("node:crypto");
    const valid = timingSafeEqual(Buffer.from(code), Buffer.from(expected));
    if (!valid) return NextResponse.json({ error: "رمز الدخول غير صحيح" }, { status: 401 });
    if (!process.env.ADMIN_SESSION_SECRET) {
      return NextResponse.json({ error: "إعدادات الجلسة غير مكتملة على الخادم" }, { status: 503 });
    }
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE, createAdminToken(), cookieOptions);
    return response;
  } catch {
    return NextResponse.json({ error: "تعذر إتمام تسجيل الدخول" }, { status: 400 });
  }
}

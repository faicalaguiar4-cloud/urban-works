import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminToken } from "../../../../lib/admin-session";

export const runtime = "nodejs";

export async function POST(request) {
  const jar = await cookies();
  if (!verifyAdminToken(jar.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const incoming = await request.formData();
    const file = incoming.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "اختر صورة أولاً" }, { status: 400 });
    }
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: "حجم الصورة يجب ألا يتجاوز 4 ميغابايت" }, { status: 413 });
    }

    const outgoing = new FormData();
    outgoing.set("file", file, file.name || "image");
    const endpoint = process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/urbanworks-admin-data";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        "x-admin-code": process.env.ADMIN_PASSCODE,
      },
      body: outgoing,
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "تعذر رفع الصورة" }, { status: 500 });
  }
}

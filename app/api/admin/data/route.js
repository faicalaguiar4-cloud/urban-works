import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminToken } from "../../../../lib/admin-session";

export const runtime = "nodejs";

async function authorized() {
  const jar = await cookies();
  return verifyAdminToken(jar.get(ADMIN_COOKIE)?.value);
}

async function callFunction({ method = "GET", table, action, payload }) {
  if (!process.env.ADMIN_PASSCODE || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "إعدادات الربط بالخادم غير مكتملة" }, { status: 503 });
  }
  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/urbanworks-admin-data");
  if (method === "GET") url.searchParams.set("table", table);
  const response = await fetch(url, {
    method,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "x-admin-code": process.env.ADMIN_PASSCODE,
    },
    ...(method !== "GET" ? { body: JSON.stringify({ table, action, payload }) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}

export async function GET(request) {
  if (!(await authorized())) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const table = new URL(request.url).searchParams.get("table");
  return callFunction({ table });
}

export async function POST(request) {
  if (!(await authorized())) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const body = await request.json();
  return callFunction({ method: "POST", table: body.table, action: body.action || "insert", payload: body.payload || {} });
}

export async function PATCH(request) {
  if (!(await authorized())) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const body = await request.json();
  return callFunction({ method: "PATCH", table: body.table, action: "update", payload: body.payload || {} });
}

export async function DELETE(request) {
  if (!(await authorized())) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const body = await request.json();
  return callFunction({ method: "DELETE", table: body.table, action: "delete", payload: body.payload || {} });
}

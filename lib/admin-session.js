import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "urbanworks_admin_session";
const MAX_AGE = 60 * 60 * 8;

function signature(value) {
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET || "")
    .update(value)
    .digest("base64url");
}

export function createAdminToken() {
  const expires = Date.now() + MAX_AGE * 1000;
  const payload = Buffer.from(JSON.stringify({ role: "admin", expires })).toString("base64url");
  return payload + "." + signature(payload);
}

export function verifyAdminToken(token) {
  if (!token || !process.env.ADMIN_SESSION_SECRET) return false;
  const [payload, supplied] = token.split(".");
  if (!payload || !supplied) return false;
  const expected = signature(payload);
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.role === "admin" && Number(data.expires) > Date.now();
  } catch {
    return false;
  }
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: MAX_AGE,
};

"use client";

import { useEffect, useState } from "react";

export default function AdminPage() {
  const [code, setCode] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setAuthenticated(Boolean(data.authenticated)))
      .catch(() => setError("تعذر الاتصال بالخادم"))
      .finally(() => setChecking(false));
  }, []);

  async function login(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر تسجيل الدخول");
      setAuthenticated(true);
      setCode("");
    } catch (e) {
      setError(e.message || "حدث خطأ، حاول مجدداً");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    setAuthenticated(false);
  }

  return (
    <main className="admin-shell" dir="rtl">
      <div className="admin-top"><a href="/" className="admin-brand">URBAN WORKS</a><a href="/">العودة للموقع ↗</a></div>
      {checking ? <div className="admin-panel"><p>جارٍ التحقق…</p></div> : authenticated ? (
        <section className="admin-panel">
          <div className="admin-symbol">UW</div>
          <p className="admin-kicker">URBAN WORKS / ADMIN</p>
          <h1>مرحباً بك في لوحة الإدارة</h1>
          <p className="admin-muted">تم تسجيل الدخول بنجاح.</p>
          <button className="admin-submit" onClick={logout}>تسجيل الخروج</button>
        </section>
      ) : (
        <section className="admin-panel">
          <div className="admin-symbol">UW</div>
          <p className="admin-kicker">URBAN WORKS / SECURE ACCESS</p>
          <h1>لوحة الإدارة</h1>
          <p className="admin-muted">أدخل رمز الدخول للمتابعة</p>
          <form onSubmit={login}>
            <label htmlFor="admin-code">رمز الدخول</label>
            <input id="admin-code" type="password" value={code} onChange={(e) => setCode(e.target.value)} placeholder="أدخل رمز الإدارة" autoComplete="current-password" required />
            {error && <p className="admin-error" role="alert">{error}</p>}
            <button className="admin-submit" disabled={busy || !code}>{busy ? "جارٍ التحقق…" : "دخول إلى لوحة الإدارة"}</button>
          </form>
        </section>
      )}
      <p className="admin-footer">© {new Date().getFullYear()} URBAN WORKS</p>
      <style jsx>{`
        .admin-shell{min-height:100vh;background:#202722;color:#f5f5ef;padding:28px 7vw;display:flex;flex-direction:column;font-family:inherit}
        .admin-top{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#c4cbbf}
        .admin-brand{font:800 20px Manrope,sans-serif;letter-spacing:-1px;color:#f5f5ef}
        .admin-panel{width:min(100%,440px);margin:auto;background:#f4f3ee;color:#202722;padding:42px;border:1px solid #d8ff62}
        .admin-symbol{width:48px;height:48px;display:grid;place-items:center;background:#d8ff62;font:800 18px Manrope,sans-serif;margin-bottom:28px}
        .admin-kicker{font:700 10px Manrope,sans-serif;letter-spacing:1.7px;color:#78856b}
        h1{font-size:30px;margin:12px 0}
        .admin-muted{color:#73786f;font-size:13px;margin-bottom:28px}
        label{display:block;font-size:13px;margin-bottom:9px}
        input{width:100%;padding:15px;border:1px solid #d1d4c9;background:white;font:inherit;outline:none}
        input:focus{border-color:#6c813d}
        .admin-submit{width:100%;margin-top:18px;padding:15px;background:#d8ff62;color:#202722;border:0;font:700 14px inherit;cursor:pointer}
        .admin-submit:disabled{opacity:.55;cursor:wait}
        .admin-error{color:#b42318;font-size:12px;margin:10px 0 0}
        .admin-footer{text-align:center;color:#9ca69a;font:10px Manrope,sans-serif}
        @media(max-width:520px){.admin-panel{padding:28px 22px}}
      `}</style>
    </main>
  );
}

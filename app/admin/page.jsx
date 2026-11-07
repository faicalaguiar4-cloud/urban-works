"use client";

import { useEffect, useState } from "react";

const tabs = [
  ["services", "الخدمات والأسعار"],
  ["print_options", "أسعار الطباعة"],
  ["orders", "الطلبات"],
  ["site_settings", "إعدادات الموقع"],
];
const emptyService = { name: "", description: "", price: "", price_unit: "للوحدة", category_id: "", is_visible: true, is_available: true, display_order: 0 };
const emptyPrint = { paper_size: "A4", paper_type: "Standard", color_mode: "bw", duplex: false, price_per_page: "0", is_visible: true };

export default function AdminPage() {
  const [code, setCode] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("services");
  const [data, setData] = useState({});
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyService);
  const [editing, setEditing] = useState(null);
  const [printForm, setPrintForm] = useState(emptyPrint);
  const [printEditing, setPrintEditing] = useState(null);
  const [settings, setSettings] = useState({});
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" }).then(r => r.json())
      .then(d => setAuthenticated(Boolean(d.authenticated))).catch(() => setError("تعذر الاتصال بالخادم"))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (authenticated) load("service_categories");
  }, [authenticated]);

  useEffect(() => {
    if (authenticated) load(tab);
  }, [authenticated, tab]);

  async function api(url, options) {
    const response = await fetch(url, options);
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "تعذر تنفيذ العملية");
    return result;
  }

  async function load(table) {
    try {
      const result = await api("/api/admin/data?table=" + table);
      if (table === "site_settings") setSettings(result.data || {});
      else setData(prev => ({ ...prev, [table]: result.data || [] }));
    } catch (e) { setError(e.message); }
  }

  async function login(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await api("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      setAuthenticated(true); setCode("");
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    setAuthenticated(false); setData({});
  }

  async function saveService(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const payload = { ...form, price: form.price === "" ? null : Number(form.price), display_order: Number(form.display_order || 0) };
      if (editing) await api("/api/admin/data", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table: "services", payload: { ...payload, id: editing } }) });
      else await api("/api/admin/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table: "services", payload }) });
      setForm(emptyService); setEditing(null); setNotice("تم حفظ الخدمة"); load("services");
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function savePrint(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const payload = { ...printForm, price_per_page: Number(printForm.price_per_page || 0) };
      if (printEditing) await api("/api/admin/data", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table: "print_options", payload: { ...payload, id: printEditing } }) });
      else await api("/api/admin/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table: "print_options", payload }) });
      setPrintForm(emptyPrint); setPrintEditing(null); setNotice("تم حفظ سعر الطباعة"); load("print_options");
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function remove(table, id) {
    if (!window.confirm("هل تريد حذف هذا العنصر؟")) return;
    try {
      await api("/api/admin/data", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table, payload: { id } }) });
      setNotice("تم الحذف"); load(table);
    } catch (e) { setError(e.message); }
  }

  async function updateOrder(id, status) {
    try {
      await api("/api/admin/data", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table: "orders", payload: { id, status } }) });
      setNotice("تم تحديث حالة الطلب"); load("orders");
    } catch (e) { setError(e.message); }
  }

  async function saveSettings(event) {
    event.preventDefault(); setBusy(true);
    try {
      await api("/api/admin/data", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table: "site_settings", payload: settings }) });
      setNotice("تم حفظ إعدادات الموقع");
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  const services = data.services || [];
  const prints = data.print_options || [];
  const orders = data.orders || [];
  const field = (label, key, type = "text") => <label className="field">{label}<input type={type} value={form[key] ?? ""} onChange={e => setForm({ ...form, [key]: e.target.value })} /></label>;

  return (
    <main className="admin-shell" dir="rtl">
      <header className="topbar"><a className="brand" href="/">URBAN WORKS</a><a href="/">عرض الموقع ↗</a></header>
      {checking ? <section className="login-card">جارٍ التحقق من الجلسة…</section> : !authenticated ? (
        <section className="login-card"><div className="mark">UW</div><p className="eyebrow">URBAN WORKS / ADMIN</p><h1>لوحة الإدارة</h1><p className="muted">أدخل رمز الدخول للمتابعة</p><form onSubmit={login}><label className="field">رمز الدخول<input type="password" value={code} onChange={e => setCode(e.target.value)} autoComplete="current-password" required /></label>{error && <p className="error">{error}</p>}<button disabled={busy || !code}>{busy ? "جارٍ التحقق…" : "دخول"}</button></form></section>
      ) : (
        <div className="dashboard">
          <div className="welcome"><div><p className="eyebrow">URBAN WORKS / CONTROL PANEL</p><h1>إدارة المحل</h1><p className="muted">تحكم في الخدمات والأسعار والطلبات ومعلومات الموقع.</p></div><button className="out" onClick={logout}>تسجيل الخروج</button></div>
          <nav className="tabs">{tabs.map(([id, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => { setTab(id); setError(""); setNotice(""); }}>{label}</button>)}</nav>
          {notice && <p className="notice">{notice}</p>}{error && <p className="error">{error}</p>}
          {tab === "services" && <section className="workspace">
            <div className="section-title"><div><h2>الخدمات والأسعار</h2><p>أضف الخدمات وعدّل أسعارها أو ظهورها في الموقع.</p></div><span>{services.length} خدمة</span></div>
            <form className="editor" onSubmit={saveService}><h3>{editing ? "تعديل الخدمة" : "إضافة خدمة جديدة"}</h3><div className="form-grid">
              {field("اسم الخدمة", "name")}{field("السعر بالدينار", "price", "number")}
              {field("وحدة السعر", "price_unit")}
              <label className="field">التصنيف<select value={form.category_id || ""} onChange={e => setForm({ ...form, category_id: e.target.value })}><option value="">بدون تصنيف</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
              <label className="field wide">الوصف<textarea value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
              <label className="check"><input type="checkbox" checked={Boolean(form.is_visible)} onChange={e => setForm({ ...form, is_visible: e.target.checked })}/> ظاهرة في الموقع</label>
              <label className="check"><input type="checkbox" checked={Boolean(form.is_available)} onChange={e => setForm({ ...form, is_available: e.target.checked })}/> متاحة للطلب</label>
            </div><div className="form-actions"><button disabled={busy}>{editing ? "حفظ التعديلات" : "إضافة الخدمة"}</button>{editing && <button type="button" className="ghost" onClick={() => { setEditing(null); setForm(emptyService); }}>إلغاء</button>}</div></form>
            <div className="records">{services.map(s => <article className="record" key={s.id}><div className="record-main"><strong>{s.name}</strong><p>{s.description || "—"}</p><small>{s.price == null ? "السعر غير محدد" : Number(s.price).toLocaleString("fr-FR") + " دج"} · {s.is_visible ? "ظاهرة" : "مخفية"}</small></div><div className="record-actions"><button className="ghost" onClick={() => { setEditing(s.id); setForm({ ...s, price: s.price ?? "" }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>تعديل</button><button className="danger" onClick={() => remove("services", s.id)}>حذف</button></div></article>)}</div>
          </section>}
          {tab === "print_options" && <section className="workspace"><div className="section-title"><div><h2>أسعار الطباعة</h2><p>حدد سعر الصفحة حسب الحجم ونوع الورق والألوان والوجهين.</p></div><span>{prints.length} خيار</span></div>
            <form className="editor" onSubmit={savePrint}><h3>{printEditing ? "تعديل خيار" : "إضافة سعر طباعة"}</h3><div className="form-grid">
              <label className="field">حجم الورق<select value={printForm.paper_size} onChange={e => setPrintForm({ ...printForm, paper_size: e.target.value })}>{["A4","A3","A2","A1","A0","Custom"].map(x => <option key={x}>{x}</option>)}</select></label>
              <label className="field">نوع الورق<input value={printForm.paper_type} onChange={e => setPrintForm({ ...printForm, paper_type: e.target.value })} /></label>
              <label className="field">الطباعة<select value={printForm.color_mode} onChange={e => setPrintForm({ ...printForm, color_mode: e.target.value })}><option value="bw">أبيض وأسود</option><option value="color">ملون</option></select></label>
              <label className="field">السعر للصفحة (دج)<input type="number" min="0" value={printForm.price_per_page} onChange={e => setPrintForm({ ...printForm, price_per_page: e.target.value })}/></label>
              <label className="check"><input type="checkbox" checked={Boolean(printForm.duplex)} onChange={e => setPrintForm({ ...printForm, duplex: e.target.checked })}/> وجهان</label>
              <label className="check"><input type="checkbox" checked={Boolean(printForm.is_visible)} onChange={e => setPrintForm({ ...printForm, is_visible: e.target.checked })}/> ظاهر للعميل</label>
            </div><div className="form-actions"><button disabled={busy}>{printEditing ? "حفظ التعديلات" : "إضافة الخيار"}</button>{printEditing && <button type="button" className="ghost" onClick={() => { setPrintEditing(null); setPrintForm(emptyPrint); }}>إلغاء</button>}</div></form>
            <div className="records">{prints.map(p => <article className="record" key={p.id}><div className="record-main"><strong>{p.paper_size} · {p.paper_type}</strong><p>{p.color_mode === "color" ? "ملون" : "أبيض وأسود"} · {p.duplex ? "وجهين" : "وجه واحد"}</p><small>{Number(p.price_per_page).toLocaleString("fr-FR")} دج للصفحة · {p.is_visible ? "ظاهر" : "مخفي"}</small></div><div className="record-actions"><button className="ghost" onClick={() => { setPrintEditing(p.id); setPrintForm({ ...p, price_per_page: String(p.price_per_page) }); }}>تعديل</button><button className="danger" onClick={() => remove("print_options", p.id)}>حذف</button></div></article>)}</div>
          </section>}
          {tab === "orders" && <section className="workspace"><div className="section-title"><div><h2>طلبات العملاء</h2><p>تابع الطلبات وغيّر حالتها.</p></div><span>{orders.length} طلب</span></div><div className="records">{orders.length ? orders.map(o => <article className="record" key={o.id}><div className="record-main"><strong>{o.customer_name} · {o.phone}</strong><p>{o.details}</p><small>{o.order_type} · {new Date(o.created_at).toLocaleString("ar-DZ")}</small></div><select className="status" value={o.status} onChange={e => updateOrder(o.id, e.target.value)}><option value="pending">قيد الانتظار</option><option value="in_progress">قيد التنفيذ</option><option value="completed">مكتمل</option><option value="cancelled">ملغى</option></select></article>) : <p className="empty">لا توجد طلبات حالياً.</p>}</div></section>}
          {tab === "site_settings" && <section className="workspace"><div className="section-title"><div><h2>إعدادات الموقع</h2><p>عدّل معلومات التواصل واسم النشاط التجاري.</p></div></div><form className="editor" onSubmit={saveSettings}><div className="form-grid">
            {["business_name","public_page_title","whatsapp_number","phone_number","address"].map((key) => <label className="field" key={key}>{({business_name:"اسم المحل",public_page_title:"عنوان الصفحة",whatsapp_number:"رقم واتساب",phone_number:"رقم الهاتف",address:"العنوان"})[key]}<input value={settings[key] || ""} onChange={e => setSettings({ ...settings, [key]: e.target.value })}/></label>)}
          </div><button disabled={busy}>حفظ الإعدادات</button></form></section>}
        </div>
      )}
      <footer>© {new Date().getFullYear()} URBAN WORKS</footer>
      <style jsx>{`
        *{box-sizing:border-box}.admin-shell{min-height:100vh;background:#202722;color:#f5f5ef;padding:26px 6vw;display:flex;flex-direction:column;font-family:inherit}.topbar{display:flex;justify-content:space-between;align-items:center;color:#cbd1c5;font-size:13px}.brand{font:800 20px Manrope,sans-serif;letter-spacing:-1px;color:#f5f5ef}.login-card{width:min(100%,440px);margin:auto;background:#f4f3ee;color:#202722;padding:40px;border:1px solid #d8ff62}.mark{width:48px;height:48px;display:grid;place-items:center;background:#d8ff62;font-weight:900;margin-bottom:25px}.eyebrow{font:700 10px Manrope,sans-serif;letter-spacing:1.6px;color:#91a079}.login-card h1,.welcome h1{font-size:30px;margin:12px 0}.muted{color:#9ba398;font-size:13px}.login-card .muted{color:#73786f;margin-bottom:25px}.field{display:flex;flex-direction:column;gap:8px;font-size:13px;color:#d8ded3}.login-card .field{color:#202722}.field input,.field select,.field textarea,.status{width:100%;padding:12px;border:1px solid #4b554a;background:#29332c;color:inherit;font:inherit;border-radius:0;min-width:0}.login-card .field input{background:#fff;color:#202722;border-color:#d1d4c9}.field textarea{min-height:80px;resize:vertical}.admin-shell button{border:0;background:#d8ff62;color:#202722;padding:12px 18px;font:700 13px inherit;cursor:pointer}.admin-shell button:disabled{opacity:.55;cursor:wait}.login-card button{width:100%;margin-top:18px}.dashboard{width:min(1100px,100%);margin:58px auto 35px}.welcome{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:28px}.welcome h1{font-size:34px}.out,.ghost{background:transparent!important;color:#dce3d7!important;border:1px solid #667061!important}.tabs{display:flex;gap:8px;flex-wrap:wrap;border-bottom:1px solid #4a554a;padding-bottom:14px;margin-bottom:24px}.tabs button{background:transparent;color:#c4cbbf}.tabs button.active{background:#d8ff62;color:#202722}.workspace{background:#29332c;border:1px solid #465044;padding:25px}.section-title{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:22px}.section-title h2{margin:0 0 7px;font-size:23px}.section-title p,.record p{margin:0;color:#aab3a5;font-size:13px}.section-title span{color:#d8ff62;font-size:12px}.editor{background:#202722;padding:20px;margin-bottom:22px;border:1px solid #465044}.editor h3{margin:0 0 18px;font-size:16px}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.wide{grid-column:1/-1}.check{display:flex;align-items:center;gap:8px;color:#dce3d7;font-size:13px}.check input{accent-color:#d8ff62}.form-actions{display:flex;gap:8px;margin-top:18px}.records{display:flex;flex-direction:column}.record{display:flex;justify-content:space-between;align-items:center;gap:15px;padding:16px 0;border-bottom:1px solid #465044}.record-main{min-width:0}.record-main strong{display:block;margin-bottom:6px}.record-main small{display:block;color:#d8ff62;font-size:11px;margin-top:7px}.record-actions{display:flex;gap:7px;flex-shrink:0}.record-actions button{padding:9px 12px}.danger{background:transparent!important;color:#ffaaa0!important;border:1px solid #80534d!important}.status{max-width:160px}.empty{text-align:center;color:#aab3a5;padding:35px}.notice{color:#d8ff62}.error{color:#ffaaa0;font-size:13px;margin:12px 0}.admin-shell footer{text-align:center;color:#879185;font-size:10px;margin-top:auto;padding-top:30px}
        @media(max-width:650px){.admin-shell{padding:20px 16px}.dashboard{margin-top:35px}.workspace{padding:16px}.welcome{align-items:flex-start;flex-direction:column}.form-grid{grid-template-columns:1fr}.wide{grid-column:auto}.record{align-items:flex-start;flex-direction:column}.record-actions{width:100%}.record-actions button{flex:1}.section-title{align-items:flex-start}.login-card{padding:28px 22px}}
      `}</style>
    </main>
  );
}

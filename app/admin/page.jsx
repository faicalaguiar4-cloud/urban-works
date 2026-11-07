"use client";

import { useEffect, useState } from "react";

const tabs = [
  ["services", "الخدمات والأسعار"],
  ["products", "المنتجات والصور"],
  ["print_options", "أسعار الطباعة"],
  ["orders", "الطلبات"],
  ["site_settings", "إعدادات الموقع"],
];
const emptyService = { name: "", description: "", price: "", price_unit: "للوحدة", category_id: "", is_visible: true, is_available: true, display_order: 0 };
const emptyPrint = { paper_size: "A4", paper_type: "Standard", color_mode: "bw", duplex: false, price_per_page: "0", is_visible: true };
const emptyProduct = { name: "", description: "", sku: "", price: "", stock_quantity: 0, image_url: "", is_visible: true, is_available: true, display_order: 0 };

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
  const [productForm, setProductForm] = useState(emptyProduct);
  const [productEditing, setProductEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
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
      else if (table === "service_categories") {
        setCategories(result.data || []);
        setData(prev => ({ ...prev, [table]: result.data || [] }));
      } else setData(prev => ({ ...prev, [table]: result.data || [] }));
    } catch (e) { setError(e.message); }
  }


  async function uploadImage(file, onUploaded) {
    if (!file) return;
    setUploading(true); setError(""); setNotice("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await api("/api/admin/upload", { method: "POST", body: formData });
      onUploaded(result.data.publicUrl);
      setNotice("تم رفع الصورة بنجاح");
    } catch (e) { setError(e.message); }
    finally { setUploading(false); }
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


  async function saveProduct(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const payload = { ...productForm, price: productForm.price === "" ? null : Number(productForm.price), stock_quantity: Number(productForm.stock_quantity || 0), display_order: Number(productForm.display_order || 0) };
      if (productEditing) await api("/api/admin/data", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table: "products", payload: { ...payload, id: productEditing } }) });
      else await api("/api/admin/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table: "products", payload }) });
      setProductForm(emptyProduct); setProductEditing(null); setNotice("تم حفظ المنتج"); load("products");
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
  const products = data.products || [];
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
              <div className="wide image-uploader"><label className="field">صورة الخدمة (اختياري)<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={uploading} onChange={e => uploadImage(e.target.files?.[0], url => setForm(current => ({ ...current, image_url: url })))} /></label>{form.image_url && <img className="image-preview" src={form.image_url} alt="معاينة صورة الخدمة" />}{uploading && <small>جارٍ رفع الصورة…</small>}</div>
              <label className="check"><input type="checkbox" checked={Boolean(form.is_visible)} onChange={e => setForm({ ...form, is_visible: e.target.checked })}/> ظاهرة في الموقع</label>
              <label className="check"><input type="checkbox" checked={Boolean(form.is_available)} onChange={e => setForm({ ...form, is_available: e.target.checked })}/> متاحة للطلب</label>
            </div><div className="form-actions"><button disabled={busy || uploading}>{editing ? "حفظ التعديلات" : "إضافة الخدمة"}</button>{editing && <button type="button" className="ghost" onClick={() => { setEditing(null); setForm(emptyService); }}>إلغاء</button>}</div></form>
            <div className="records">{services.map(s => <article className="record" key={s.id}>{s.image_url && <img className="record-thumb" src={s.image_url} alt={s.name} />}<div className="record-main"><strong>{s.name}</strong><p>{s.description || "—"}</p><small>{s.price == null ? "السعر غير محدد" : Number(s.price).toLocaleString("fr-FR") + " دج"} · {s.is_visible ? "ظاهرة" : "مخفية"}</small></div><div className="record-actions"><button className="ghost" onClick={() => { setEditing(s.id); setForm({ ...s, price: s.price ?? "" }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>تعديل</button><button className="danger" onClick={() => remove("services", s.id)}>حذف</button></div></article>)}</div>
          </section>}
          {tab === "products" && <section className="workspace">
            <div className="section-title"><div><h2>المنتجات والصور</h2><p>أضف منتجاً جديداً مع صورته وسعره ومخزونه، أو عدّل منتجاً موجوداً.</p></div><span>{products.length} منتج</span></div>
            <form className="editor" onSubmit={saveProduct}><h3>{productEditing ? "تعديل المنتج" : "إضافة منتج جديد"}</h3><div className="form-grid">
              <label className="field">اسم المنتج<input required value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} /></label>
              <label className="field">السعر بالدينار<input type="number" min="0" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} /></label>
              <label className="field">رمز المنتج / SKU<input value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} /></label>
              <label className="field">الكمية المتوفرة<input type="number" min="0" value={productForm.stock_quantity} onChange={e => setProductForm({ ...productForm, stock_quantity: e.target.value })} /></label>
              <label className="field wide">الوصف<textarea value={productForm.description || ""} onChange={e => setProductForm({ ...productForm, description: e.target.value })} /></label>
              <div className="wide image-uploader"><label className="field">صورة المنتج<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={uploading} onChange={e => uploadImage(e.target.files?.[0], url => setProductForm(current => ({ ...current, image_url: url })))} /></label>{productForm.image_url && <img className="image-preview" src={productForm.image_url} alt="معاينة صورة المنتج" />}{uploading && <small>جارٍ رفع الصورة…</small>}<small>JPG أو PNG أو WEBP أو GIF، بحد أقصى 4 ميغابايت.</small></div>
              <label className="check"><input type="checkbox" checked={Boolean(productForm.is_visible)} onChange={e => setProductForm({ ...productForm, is_visible: e.target.checked })}/> ظاهر في الموقع</label>
              <label className="check"><input type="checkbox" checked={Boolean(productForm.is_available)} onChange={e => setProductForm({ ...productForm, is_available: e.target.checked })}/> متاح للبيع</label>
            </div><div className="form-actions"><button disabled={busy || uploading}>{productEditing ? "حفظ التعديلات" : "إضافة المنتج"}</button>{productEditing && <button type="button" className="ghost" onClick={() => { setProductEditing(null); setProductForm(emptyProduct); }}>إلغاء</button>}</div></form>
            <div className="records">{products.map(p => <article className="record" key={p.id}>{p.image_url && <img className="record-thumb" src={p.image_url} alt={p.name} />}<div className="record-main"><strong>{p.name}</strong><p>{p.description || "—"}</p><small>{p.price == null ? "السعر غير محدد" : Number(p.price).toLocaleString("fr-FR") + " دج"} · المخزون: {p.stock_quantity} · {p.is_visible ? "ظاهر" : "مخفي"}</small></div><div className="record-actions"><button className="ghost" onClick={() => { setProductEditing(p.id); setProductForm({ ...p, price: p.price ?? "" }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>تعديل</button><button className="danger" onClick={() => remove("products", p.id)}>حذف</button></div></article>)}</div>
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
        *{box-sizing:border-box}
        .admin-shell{--a:#ed542b;--ink:#111214;--panel:#1b1c1e;--panel2:#222427;--line:#36383b;--muted:#a3a5a8;min-height:100vh;background:radial-gradient(ellipse at 85% 0%,#ed542b18,transparent 32%),linear-gradient(135deg,#111214,#191a1c 60%,#111214);color:#f7f7f5;padding:25px clamp(16px,5vw,76px);display:flex;flex-direction:column;font-family:inherit;position:relative;isolation:isolate}
        .admin-shell:before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background-image:linear-gradient(#ffffff08 1px,transparent 1px),linear-gradient(90deg,#ffffff08 1px,transparent 1px);background-size:48px 48px;mask-image:linear-gradient(135deg,#000,transparent 75%)}
        .topbar{display:flex;justify-content:space-between;align-items:center;color:#d2d2d0;font-size:13px;padding:8px 0 22px;border-bottom:1px solid #ffffff18}
        .brand{font:800 20px Manrope,sans-serif;letter-spacing:-1px;color:#fff;display:flex;align-items:center;gap:12px}
        .brand:before{content:"UW";display:grid;place-items:center;width:42px;height:42px;clip-path:polygon(50% 0,96% 25%,96% 75%,50% 100%,4% 75%,4% 25%);background:var(--a);color:white;font:900 13px Manrope,sans-serif;letter-spacing:-2px}
        .topbar>a:last-child{border:1px solid #ffffff35;padding:11px 16px;transition:.2s}.topbar>a:last-child:hover{border-color:var(--a);color:#ff8b6d}
        .login-card{width:min(100%,460px);margin:auto;background:linear-gradient(145deg,#fff,#f4f3f0);color:#171819;padding:clamp(28px,5vw,48px);border:1px solid #ffffff;box-shadow:0 25px 90px #0008;position:relative}
        .login-card:before{content:"";position:absolute;inset:0 auto 0 0;width:5px;background:var(--a)}
        .mark{width:62px;height:62px;display:grid;place-items:center;background:var(--a);color:#fff;font:900 19px Manrope,sans-serif;clip-path:polygon(50% 0,96% 25%,96% 75%,50% 100%,4% 75%,4% 25%);margin-bottom:28px}
        .eyebrow{font:700 10px Manrope,sans-serif;letter-spacing:1.7px;color:var(--a)}
        .login-card h1,.welcome h1{font-size:32px;margin:12px 0;letter-spacing:-.5px}.muted{color:var(--muted);font-size:13px}.login-card .muted{color:#737579;margin-bottom:25px}
        .field{display:flex;flex-direction:column;gap:8px;font-size:13px;color:#dededb;min-width:0}
        .login-card .field{color:#292a2c}
        .field input,.field select,.field textarea,.status{width:100%;padding:13px 14px;border:1px solid #45474a;background:#161719;color:#f5f5f3;font:inherit;border-radius:0;min-width:0;outline:none;transition:border .2s,box-shadow .2s}
        .field input:focus,.field select:focus,.field textarea:focus,.status:focus{border-color:var(--a);box-shadow:0 0 0 3px #ed542b20}
        .login-card .field input{background:#fff;color:#171819;border-color:#d5d5d1}
        .field textarea{min-height:90px;resize:vertical}
        .admin-shell button{border:1px solid var(--a);background:var(--a);color:#fff;padding:12px 19px;font:700 13px inherit;cursor:pointer;transition:background .2s,border .2s,transform .2s}
        .admin-shell button:hover:not(:disabled){background:#d94320;border-color:#d94320;transform:translateY(-1px)}
        .admin-shell button:disabled{opacity:.55;cursor:wait}
        .login-card button{width:100%;margin-top:18px;padding:15px}
        .dashboard{width:min(1180px,100%);margin:42px auto 38px}
        .welcome{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:30px;padding:28px 30px;background:linear-gradient(110deg,#252629,#191a1c);border:1px solid #ffffff18;position:relative;overflow:hidden}
        .welcome:after{content:"UW";position:absolute;left:25px;top:-32px;font:900 130px Manrope,sans-serif;letter-spacing:-16px;color:#ffffff08;pointer-events:none}
        .welcome .eyebrow{margin:0 0 9px}.welcome h1{font-size:35px;margin:0 0 7px}.welcome .muted{margin:0}
        .out,.ghost{background:transparent!important;color:#f0f0ed!important;border:1px solid #5a5c60!important}.out:hover,.ghost:hover{border-color:var(--a)!important;color:#ff997e!important;background:#ed542b12!important}
        .tabs{display:flex;gap:8px;flex-wrap:wrap;border-bottom:1px solid #ffffff25;padding:0 0 15px;margin-bottom:22px}
        .tabs button{background:#202124;color:#c6c7c7;border-color:#ffffff18;padding:12px 17px}.tabs button.active{background:var(--a);color:white;border-color:var(--a);box-shadow:0 6px 18px #ed542b35}
        .workspace{background:#1b1c1e;border:1px solid #ffffff20;padding:clamp(17px,3vw,30px);box-shadow:0 18px 55px #0002}
        .section-title{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:24px;padding-bottom:19px;border-bottom:1px solid #ffffff17}
        .section-title h2{margin:0 0 7px;font-size:23px}.section-title p,.record p{margin:0;color:#a5a6a8;font-size:13px;line-height:1.8}
        .section-title>span{color:#ff896b;background:#ed542b18;border:1px solid #ed542b45;padding:8px 12px;font-size:12px;white-space:nowrap}
        .editor{background:#222427;padding:22px;margin-bottom:25px;border:1px solid #ffffff16;position:relative}
        .editor:before{content:"";position:absolute;top:0;right:0;width:44px;height:3px;background:var(--a)}
        .editor h3{margin:0 0 20px;font-size:17px}
        .form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:17px}.wide{grid-column:1/-1}
        .check{display:flex;align-items:center;gap:9px;color:#dededb;font-size:13px}.check input{width:16px;height:16px;accent-color:var(--a)}
        .form-actions{display:flex;gap:9px;margin-top:20px}
        .records{display:flex;flex-direction:column}
        .record{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:17px 14px;border-bottom:1px solid #ffffff15;transition:background .2s}
        .record:hover{background:#ffffff06}.record-main{flex:1;min-width:0}.record-main strong{display:block;margin-bottom:6px;color:#fff;font-size:14px}.record-main small{display:block;color:#ff987d;font-size:11px;margin-top:8px}
        .image-uploader{display:grid;grid-template-columns:minmax(0,1fr) 120px;gap:12px;align-items:center}.image-uploader input[type=file]{padding:10px;background:#17181a}.image-uploader small{grid-column:1/-1;color:#a5a6a8}
        .image-preview,.record-thumb{width:112px;height:84px;object-fit:cover;border:1px solid #ffffff35;background:#111}.record-thumb{flex:0 0 86px;width:86px;height:72px}
        .record-actions{display:flex;gap:7px;flex-shrink:0}.record-actions button{padding:9px 13px}
        .danger{background:transparent!important;color:#ff9a88!important;border:1px solid #a34e42!important}.danger:hover{background:#a52e201f!important;border-color:#ed542b!important}
        .status{max-width:170px;background:#17181a}.empty{text-align:center;color:#a5a6a8;padding:40px}
        .notice{color:#ff9b7f;background:#ed542b18;border:1px solid #ed542b55;padding:12px 15px;font-size:13px}
        .error{color:#ffaaa0;background:#7e261d30;border:1px solid #a94d43;padding:11px 14px;font-size:13px;margin:12px 0}
        .admin-shell footer{text-align:center;color:#77797b;font:600 9px Manrope,sans-serif;letter-spacing:1.5px;margin-top:auto;padding:30px 0 8px;border-top:1px solid #ffffff15}
        @media(max-width:650px){.image-uploader{grid-template-columns:1fr}.admin-shell{padding:17px 13px}.dashboard{margin-top:25px}.workspace{padding:15px}.welcome{align-items:flex-start;flex-direction:column;padding:23px 19px}.welcome h1{font-size:29px}.form-grid{grid-template-columns:1fr}.wide{grid-column:auto}.record{align-items:flex-start;flex-wrap:wrap;padding:15px 7px}.record-main{flex-basis:calc(100% - 105px)}.record-actions{width:100%}.record-actions button{flex:1}.section-title{align-items:flex-start}.login-card{padding:28px 22px}.tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.tabs button{padding:11px 7px;font-size:11px}.section-title h2{font-size:20px}}
      `}</style>
    </main>
  );
}

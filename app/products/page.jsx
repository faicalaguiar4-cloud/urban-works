"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=100075914692165&locale=ar_AR";
function orderMessage(item, kind) {
  return `السلام عليكم URBAN WORKS، أود طلب ${kind}: ${item.name}.\nالسعر المعروض: ${item.price != null ? Number(item.price).toLocaleString("fr-FR") + " دج" : "يرجى تأكيد السعر"}.\nأرجو تزويدي بالتفاصيل وإجراءات الطلب. شكراً.`;
}
async function openFacebookOrder(item, kind) {
  const message = orderMessage(item, kind);
  window.open(FACEBOOK_URL, "_blank", "noopener,noreferrer");
  try {
    await navigator.clipboard.writeText(message);
    alert("تم نسخ رسالة الطلب. الصقها في محادثة Facebook لإرسالها من حسابك.");
  } catch {
    window.prompt("انسخ رسالة الطلب ثم الصقها في محادثة Facebook:", message);
  }
}

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : null;

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({ business_name: "URBAN WORKS" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabase) {
        setError("قائمة المنتجات غير متاحة حالياً.");
        setLoading(false);
        return;
      }
      const [{ data, error: productsError }, { data: site }] = await Promise.all([
        supabase.from("products")
          .select("id,name,description,price,stock_quantity,image_url,sku")
          .eq("is_visible", true)
          .eq("is_available", true)
          .order("display_order", { ascending: true }),
        supabase.from("site_settings").select("business_name").eq("id", 1).maybeSingle(),
      ]);
      if (!active) return;
      if (productsError) setError("تعذر تحميل المنتجات. حاول تحديث الصفحة.");
      else setProducts(data || []);
      if (site) setSettings(site);
      setLoading(false);
    }
    load().catch(() => {
      if (active) {
        setError("حدث خطأ أثناء تحميل المنتجات.");
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  return (
    <main className="catalog" dir="rtl">
      <header className="catalog-nav">
        <Link className="catalog-brand" href="/">URBAN<span>WORKS</span></Link>
        <nav>
          <Link href="/">الرئيسية</Link>
          <Link href="/#services">خدماتنا</Link>
          <Link href="/#contact">اتصل بنا</Link>
        </nav>
      </header>

      <section className="catalog-hero">
        <p className="eyebrow">URBAN WORKS / CATALOG</p>
        <h1>منتجاتنا <em>المتاحة.</em></h1>
        <p>تصفح المنتجات المتوفرة لدينا، اطّلع على صورها وأسعارها، وتواصل معنا لطلب ما يناسبك.</p>
      </section>

      <section className="catalog-content">
        {loading ? (
          <p className="catalog-message">جارٍ تحميل المنتجات…</p>
        ) : error ? (
          <p className="catalog-message">{error}</p>
        ) : products.length === 0 ? (
          <div className="catalog-empty">
            <div className="empty-mark">UW</div>
            <h2>لا توجد منتجات معروضة حالياً</h2>
            <p>ستظهر المنتجات هنا تلقائياً عندما يضيفها المتجر من لوحة الإدارة.</p>
            <Link href="/">العودة إلى الموقع</Link>
          </div>
        ) : (
          <div className="catalog-grid">
            {products.map((product) => (
              <article className="catalog-card" key={product.id}>
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} loading="lazy" />
                ) : (
                  <div className="catalog-placeholder">URBAN WORKS</div>
                )}
                <div className="catalog-card-body">
                  <h2>{product.name}</h2>
                  <p>{product.description || "منتج متوفر لدى " + settings.business_name + "."}</p>
                  <div className="catalog-card-foot">
                    {product.price != null
                      ? <strong>{Number(product.price).toLocaleString("fr-FR")} دج</strong>
                      : <strong>السعر عند الطلب</strong>}
                    <span>{Number(product.stock_quantity) > 0 ? "متوفر" : "حسب الطلب"}</span>
                  </div>
                  <button className="catalog-contact" type="button" onClick={() => openFacebookOrder(product, "المنتج")}>اطلب الآن عبر Facebook ↗</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="catalog-footer">
        <Link className="catalog-brand" href="/">URBAN<span>WORKS</span></Link>
        <p>© {new Date().getFullYear()} {settings.business_name}. جميع الحقوق محفوظة.</p>
        <Link href="/admin">لوحة الإدارة</Link>
      </footer>

      <style jsx>{`
        .catalog{min-height:100vh;background:#fff;color:#171a18;display:flex;flex-direction:column}
        .catalog-nav{height:82px;padding:0 7vw;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #d9d9d1}
        .catalog-brand{font:800 22px Manrope,sans-serif;letter-spacing:-1.5px;direction:ltr}
        .catalog-brand span{font-weight:400}
        .catalog-nav nav{display:flex;gap:30px;font-size:13px;color:#5e665c}
        .catalog-hero{background:#111214;color:#f5f5ef;padding:76px 10vw 82px}
        .eyebrow{font:700 10px Manrope,sans-serif;letter-spacing:2px;color:#ed542b}
        .catalog-hero h1{font-size:clamp(42px,6vw,70px);margin:18px 0 12px;line-height:1.2}
        .catalog-hero h1 em{font-style:normal;color:#ed542b}
        .catalog-hero>p:last-child{max-width:560px;color:#bdc6b9;line-height:2;font-size:14px}
        .catalog-content{width:min(1120px,86vw);margin:0 auto;padding:55px 0 80px;flex:1}
        .catalog-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
        .catalog-card{background:white;border:1px solid #d9d9d1;overflow:hidden}
        .catalog-card>img,.catalog-placeholder{width:100%;height:240px;object-fit:cover;display:grid;place-items:center;background:#f0f0ee;color:#ed542b;font:800 18px Manrope,sans-serif}
        .catalog-card-body{padding:20px}
        .catalog-card h2{font-size:20px;margin:0 0 8px}
        .catalog-card p{min-height:48px;margin:0;color:#777b73;line-height:1.9;font-size:12px}
        .catalog-card-foot{display:flex;justify-content:space-between;align-items:center;margin:20px 0 16px}
        .catalog-card-foot strong{font-size:16px}
        .catalog-card-foot span{font-size:11px;color:#ed542b}
        .catalog-contact{display:inline-flex;align-items:center;justify-content:center;padding:12px 16px;background:#ed542b;color:#fff;border:0;font:700 12px inherit;cursor:pointer;transition:background .2s,transform .2s}.catalog-contact:hover{background:#d94320;transform:translateY(-2px)}
        .catalog-message{text-align:center;padding:55px;color:#70786d}
        .catalog-empty{text-align:center;padding:70px 20px;border:1px solid #d9d9d1;background:white}
        .empty-mark{width:54px;height:54px;margin:0 auto 22px;display:grid;place-items:center;background:#ed542b;font:800 18px Manrope}
        .catalog-empty h2{font-size:23px}
        .catalog-empty p{color:#777b73;font-size:13px}
        .catalog-empty>a{display:inline-block;margin-top:15px;padding:12px 18px;background:#111214;color:white;font-size:12px}
        .catalog-footer{border-top:1px solid #d9d9d1;padding:26px 7vw;display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:11px;color:#777b73}
        @media(max-width:760px){.catalog-nav{height:72px;padding:0 6vw}.catalog-nav nav{gap:14px;font-size:11px}.catalog-hero{padding:58px 7vw}.catalog-content{width:86vw;padding:35px 0 55px}.catalog-grid{grid-template-columns:1fr}.catalog-card>img,.catalog-placeholder{height:220px}.catalog-footer{flex-wrap:wrap}}
      `}</style>
    </main>
  );
}

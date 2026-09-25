// Hero contrast check (design brief, 24 September 2026, phase 1).
//
// Not a Node script: a Playwright snippet for the Playwright MCP's browser_run_code, run as
//   browser_run_code_unsafe({ filename: "scripts/check-hero-contrast.playwright.js" })
// against the dev server on :8888. For every line of text in each page's photo hero, and every
// nav link over it, it hides the text, screenshots, and compares the text's effective colour
// against every pixel under that line - so a pass means the worst pixel passes, not the average.
// Body 4.5:1, large text 3:1. Re-run after changing the hero tint or adding a hero photo.
// Also measures the header's outlined Shop label (white on the photo) since 25 September.

async (page) => {
  // For every line of text in each hero (and the nav links sitting over it): record the line boxes
  // and the text's effective colour, hide the text, screenshot, then compare that colour against
  // every pixel of real photo + tint under each line. Worst pixel and 5th percentile reported.
  const pages = ["/", "/about/", "/our-work/", "/get-involved/", "/get-involved/volunteer/", "/get-involved/donate-goods/", "/get-involved/corporate-partnership/", "/donate/", "/contact/", "/shop/", "/shop/worry-dolls/", "/shop/worry-dolls/african-worry-doll-female/", "/shop/order-confirmed/", "/shop/order-cancelled/"];
  const widths = [360, 390, 768, 820, 900, 1024, 1280, 1440];
  const results = [];
  for (const w of widths) {
    await page.setViewportSize({ width: w, height: 900 });
    for (const p of pages) {
      await page.goto("http://localhost:8888" + p, { waitUntil: "load" });
      await page.evaluate(async () => {
        window.scrollTo(0, 0);
        const img = document.querySelector(".photo-hero .hero-bg img");
        if (img && !img.complete) await new Promise((r) => img.addEventListener("load", r, { once: true }));
        await new Promise((r) => setTimeout(r, 400));
      });
      const lines = await page.evaluate(() => {
        const out = [];
        const hero = document.querySelector(".photo-hero");
        const roots = [...hero.querySelectorAll(".hero-content h1, .hero-content p, .hero-content a:not(.btn), .hero-content li")];
        document.querySelectorAll(".site-header #primary-nav a, .site-header .brand span, .site-header .header-shop").forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width && r.height && getComputedStyle(el).visibility !== "hidden" && r.bottom > 0 && r.top < hero.getBoundingClientRect().bottom) roots.push(el);
        });
        const seen = new Set();
        for (const root of roots) {
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
          let n;
          while ((n = walker.nextNode())) {
            if (!n.textContent.trim()) continue;
            const el = n.parentElement;
            // Buttons are skipped (filled, so their label sits on their own fill) - except the header's
            // outlined Shop, whose white label sits on the photo.
            if ((el.closest(".btn") && !el.closest(".header-shop")) || el.closest("[hidden]")) continue;
            const cs = getComputedStyle(el);
            let op = 1;
            for (let a = el; a && a !== document.body; a = a.parentElement) op *= Number(getComputedStyle(a).opacity);
            const m = cs.color.match(/[\d.]+/g).map(Number);
            const alpha = (m[3] ?? 1) * op;
            const size = parseFloat(cs.fontSize), weight = Number(cs.fontWeight);
            const large = size >= 24 || (size >= 18.66 && weight >= 700);
            const range = document.createRange();
            range.selectNodeContents(n);
            for (const r of range.getClientRects()) {
              if (r.width < 2 || r.height < 2) continue;
              const id = `${Math.round(r.x)},${Math.round(r.y)}`;
              if (seen.has(id)) continue;
              seen.add(id);
              out.push({ tag: el.closest(".header-shop") ? "shop-btn" : el.closest("#primary-nav, .brand") ? "nav" : el.tagName.toLowerCase() + (el.className ? "." + String(el.className).split(" ")[0] : ""), text: n.textContent.trim().slice(0, 24), x: r.x, y: r.y, w: r.width, h: r.height, rgb: m.slice(0, 3), alpha, large });
            }
          }
        }
        return out;
      });
      await page.addStyleTag({ content: ".photo-hero .hero-content *, .site-header #primary-nav a, .site-header .brand span, .site-header .header-shop { color: transparent !important; text-decoration-color: transparent !important; text-shadow: none !important; } .photo-hero .hero-content li::before { color: transparent !important; }" });
      await page.waitForTimeout(150);
      const shot = await page.screenshot({ type: "png" });
      const res = await page.evaluate(async ({ b64, lines }) => {
        const img = new Image();
        img.src = "data:image/png;base64," + b64;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.width; c.height = img.height;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
        const L = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
        return lines.map((ln) => {
          const x = Math.max(0, Math.floor(ln.x)), y = Math.max(0, Math.floor(ln.y));
          const w = Math.min(c.width - x, Math.ceil(ln.w)), h = Math.min(c.height - y, Math.ceil(ln.h));
          if (w <= 0 || h <= 0) return null;
          const d = ctx.getImageData(x, y, w, h).data;
          const vals = [];
          for (let i = 0; i < d.length; i += 4) {
            const br = d[i], bg = d[i + 1], bb = d[i + 2];
            const tr = ln.alpha * ln.rgb[0] + (1 - ln.alpha) * br, tg = ln.alpha * ln.rgb[1] + (1 - ln.alpha) * bg, tb = ln.alpha * ln.rgb[2] + (1 - ln.alpha) * bb;
            const l1 = L(tr, tg, tb), l2 = L(br, bg, bb);
            vals.push((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05));
          }
          vals.sort((a, b) => a - b);
          return { tag: ln.tag, text: ln.text, large: ln.large, worst: +vals[0].toFixed(2), p5: +vals[Math.floor(vals.length * 0.05)].toFixed(2) };
        }).filter(Boolean);
      }, { b64: shot.toString("base64"), lines });
      for (const r of res) results.push({ page: p, w, ...r, need: r.large ? 3 : 4.5 });
    }
  }
  const fails = results.filter((r) => r.worst < r.need);
  const byPage = {};
  for (const r of results) {
    const k = r.page;
    byPage[k] ??= { worstBody: 99, worstLarge: 99, worstNav: 99 };
    if (r.tag === "nav") byPage[k].worstNav = Math.min(byPage[k].worstNav, r.worst);
    else if (r.large) byPage[k].worstLarge = Math.min(byPage[k].worstLarge, r.worst);
    else byPage[k].worstBody = Math.min(byPage[k].worstBody, r.worst);
  }
  return JSON.stringify({ lines: results.length, fails: fails.map((f) => `${f.page} @${f.w} ${f.tag} "${f.text}" worst ${f.worst} p5 ${f.p5} (need ${f.need})`), byPage }, null, 1);
}

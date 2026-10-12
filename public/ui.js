(() => {
  // src/ui.tsx
  function h(tag, props, ...children) {
    if (typeof tag === "function") return tag({ ...props || {}, children });
    const svgTags = /* @__PURE__ */ new Set(["svg", "path"]);
    const node = svgTags.has(tag) ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
    const attrs = props || {};
    for (const [key, value] of Object.entries(attrs)) {
      if (key === "children" || value == null || value === false) continue;
      if (key.startsWith("on") && typeof value === "function") {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (key === "className") node.setAttribute("class", String(value));
      else if (key === "ariaPressed") node.setAttribute("aria-pressed", String(value));
      else if (key === "disabled" && value) node.disabled = true;
      else if (key === "style" && typeof value === "object") Object.assign(node.style, value);
      else node.setAttribute(key, value === true ? "" : String(value));
    }
    const append = (child) => {
      if (Array.isArray(child)) child.forEach(append);
      else if (child instanceof Node) node.appendChild(child);
      else if (child !== null && child !== void 0 && child !== false) node.appendChild(document.createTextNode(String(child)));
    };
    children.forEach(append);
    return node;
  }
  var icon = (name) => /* @__PURE__ */ h("iconify-icon", { icon: name, "aria-hidden": "true" });
  var startWizard = () => document.querySelector("#guidedStart")?.click();
  function Brand() {
    return /* @__PURE__ */ h("a", { className: "brand", href: "#top", "aria-label": "RuangAI beranda" }, /* @__PURE__ */ h("span", { className: "brand-mark" }, icon("lucide:sparkles")), /* @__PURE__ */ h("span", null, "Ruang", /* @__PURE__ */ h("em", null, "AI")));
  }
  function Header() {
    return /* @__PURE__ */ h("header", { className: "site-header" }, /* @__PURE__ */ h("div", { className: "wrap header-inner" }, /* @__PURE__ */ h(Brand, null), /* @__PURE__ */ h("span", { className: "header-greeting" }, /* @__PURE__ */ h("span", { className: "flag-dot" }, /* @__PURE__ */ h("i", null), /* @__PURE__ */ h("i", null)), " Asisten AI untuk ide Indonesia"), /* @__PURE__ */ h("nav", { className: "main-nav", id: "mainNav", "aria-label": "Navigasi utama" }, /* @__PURE__ */ h("a", { href: "#fitur" }, "Fitur"), /* @__PURE__ */ h("a", { href: "#cara-kerja" }, "Cara kerja"), /* @__PURE__ */ h("a", { href: "#nusantara" }, "Nusantara"), /* @__PURE__ */ h("a", { href: "#faq" }, "FAQ")), /* @__PURE__ */ h("div", { className: "header-actions" }, /* @__PURE__ */ h("button", { className: "btn btn-white", id: "loginBtn", "data-dashboard": true }, "Masuk"), /* @__PURE__ */ h("button", { className: "btn btn-red header-cta", id: "headerStart", "data-dashboard": true }, "Mulai sekarang ", icon("lucide:arrow-right")), /* @__PURE__ */ h("button", { className: "mobile-menu", id: "mobileMenu", "aria-label": "Buka navigasi", "aria-expanded": "false" }, icon("lucide:menu")))));
  }
  var steps = [
    { icon: "lucide:message-circle", label: "01", title: "Ceritakan kebutuhanmu", text: "Mulai dari pertanyaan sederhana. Pilih tujuan agar RuangAI tahu arah yang kamu cari.", chip: "Mulai dari ceritamu" },
    { icon: "lucide:sparkles", label: "02", title: "Rangkai jawaban bersama", text: "Tambahkan konteks, minta contoh, lalu atur gaya jawaban sesuai kebutuhanmu.", chip: "Bisa disesuaikan" },
    { icon: "lucide:map", label: "03", title: "Bawa ide jadi langkah", text: "Pahami pilihan yang ada dan tentukan langkah berikutnya dengan lebih percaya diri.", chip: "Kamu pegang kendali" }
  ];
  function Journey() {
    return /* @__PURE__ */ h("div", { className: "journey-shell reveal" }, /* @__PURE__ */ h("div", { className: "journey-rail", "aria-hidden": "true" }, /* @__PURE__ */ h("span", null), /* @__PURE__ */ h("span", null), /* @__PURE__ */ h("span", null)), /* @__PURE__ */ h("div", { className: "journey-grid" }, steps.map((step, index) => /* @__PURE__ */ h("article", { className: "journey-card how-step reveal-child", key: step.label }, /* @__PURE__ */ h("div", { className: "journey-card-top" }, /* @__PURE__ */ h("span", { className: "journey-icon" }, icon(step.icon)), /* @__PURE__ */ h("span", { className: "step-num" }, step.label)), /* @__PURE__ */ h("div", { className: "journey-copy" }, /* @__PURE__ */ h("span", { className: "journey-overline" }, "LANGKAH ", step.label), /* @__PURE__ */ h("h3", null, step.title), /* @__PURE__ */ h("p", null, step.text), /* @__PURE__ */ h("span", { className: "journey-chip" }, icon("lucide:check"), step.chip)), index < 2 && /* @__PURE__ */ h("span", { className: "journey-next", "aria-hidden": "true" }, icon("lucide:arrow-right"))))), /* @__PURE__ */ h("div", { className: "journey-footer" }, /* @__PURE__ */ h("span", null, icon("lucide:heart-handshake"), " Dirancang untuk menemani, bukan mengambil alih keputusanmu."), /* @__PURE__ */ h("button", { className: "journey-link", onClick: startWizard }, "Coba alur panduan ", icon("lucide:arrow-right"))));
  }
  var headerMount = document.querySelector("#headerMount");
  if (headerMount) headerMount.replaceWith(Header());
  var journeyMount = document.querySelector("#journeyMount");
  if (journeyMount) journeyMount.replaceWith(Journey());
})();

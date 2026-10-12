/** RuangAI landing navigation and guided journey components. Built from TSX. */
type Props = Record<string, unknown>;
type NodeChild = HTMLElement | Text | string | number | null | undefined | false | NodeChild[];

function h(tag: string | ((props: Props) => NodeChild), props: Props | null, ...children: NodeChild[]): NodeChild {
  if (typeof tag === "function") return tag({ ...(props || {}), children });
  const svgTags = new Set(["svg", "path"]);
  const node = svgTags.has(tag) ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
  const attrs = props || {};
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "children" || value == null || value === false) continue;
    if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
    } else if (key === "className") node.setAttribute("class", String(value));
    else if (key === "ariaPressed") node.setAttribute("aria-pressed", String(value));
    else if (key === "disabled" && value) (node as HTMLButtonElement).disabled = true;
    else if (key === "style" && typeof value === "object") Object.assign((node as HTMLElement).style, value);
    else node.setAttribute(key, value === true ? "" : String(value));
  }
  const append = (child: NodeChild): void => {
    if (Array.isArray(child)) child.forEach(append);
    else if (child instanceof Node) node.appendChild(child);
    else if (child !== null && child !== undefined && child !== false) node.appendChild(document.createTextNode(String(child)));
  };
  children.forEach(append);
  return node;
}
const Fragment = (_: Props) => document.createDocumentFragment();
const icon = (name: string) => <iconify-icon icon={name} aria-hidden="true" />;
const startWizard = () => document.querySelector<HTMLButtonElement>("#guidedStart")?.click();

function Brand() {
  return <a className="brand" href="#top" aria-label="RuangAI beranda">
    <span className="brand-mark">{icon("lucide:sparkles")}</span><span>Ruang<em>AI</em></span>
  </a>;
}

function Header() {
  return <header className="site-header">
    <div className="wrap header-inner">
      <Brand />
      <span className="header-greeting"><span className="flag-dot"><i></i><i></i></span> Asisten AI untuk ide Indonesia</span>
      <nav className="main-nav" id="mainNav" aria-label="Navigasi utama">
        <a href="#fitur">Fitur</a><a href="#cara-kerja">Cara kerja</a><a href="#nusantara">Nusantara</a><a href="#faq">FAQ</a>
      </nav>
      <div className="header-actions">
        <button className="btn btn-white" id="loginBtn" data-dashboard>Masuk</button>
        <button className="btn btn-red header-cta" id="headerStart" data-dashboard>Mulai sekarang {icon("lucide:arrow-right")}</button>
        <button className="mobile-menu" id="mobileMenu" aria-label="Buka navigasi" aria-expanded="false">{icon("lucide:menu")}</button>
      </div>
    </div>
  </header>;
}

const steps = [
  { icon: "lucide:message-circle", label: "01", title: "Ceritakan kebutuhanmu", text: "Mulai dari pertanyaan sederhana. Pilih tujuan agar RuangAI tahu arah yang kamu cari.", chip: "Mulai dari ceritamu" },
  { icon: "lucide:sparkles", label: "02", title: "Rangkai jawaban bersama", text: "Tambahkan konteks, minta contoh, lalu atur gaya jawaban sesuai kebutuhanmu.", chip: "Bisa disesuaikan" },
  { icon: "lucide:map", label: "03", title: "Bawa ide jadi langkah", text: "Pahami pilihan yang ada dan tentukan langkah berikutnya dengan lebih percaya diri.", chip: "Kamu pegang kendali" },
];

function Journey() {
  return <div className="journey-shell reveal">
    <div className="journey-rail" aria-hidden="true"><span></span><span></span><span></span></div>
    <div className="journey-grid">
      {steps.map((step, index) => <article className="journey-card how-step reveal-child" key={step.label}>
        <div className="journey-card-top"><span className="journey-icon">{icon(step.icon)}</span><span className="step-num">{step.label}</span></div>
        <div className="journey-copy"><span className="journey-overline">LANGKAH {step.label}</span><h3>{step.title}</h3><p>{step.text}</p>
          <span className="journey-chip">{icon("lucide:check")}{step.chip}</span>
        </div>
        {index < 2 && <span className="journey-next" aria-hidden="true">{icon("lucide:arrow-right")}</span>}
      </article>)}
    </div>
    <div className="journey-footer"><span>{icon("lucide:heart-handshake")} Dirancang untuk menemani, bukan mengambil alih keputusanmu.</span><button className="journey-link" onClick={startWizard}>Coba alur panduan {icon("lucide:arrow-right")}</button></div>
  </div>;
}

const headerMount = document.querySelector("#headerMount");
if (headerMount) headerMount.replaceWith(Header() as Node);
const journeyMount = document.querySelector("#journeyMount");
if (journeyMount) journeyMount.replaceWith(Journey() as Node);

/* RuangAI — navigasi landing/dashboard, wizard, dan chat yang tersambung ke backend /api/chat. */
(() => {
  const $ = (s) => document.querySelector(s);
  const landing = $("#landingPage"),
    workspace = $("#workspace"),
    dashView = $("#dashboardView"),
    chatView = $("#chatView"),
    input = $("#chatInput"),
    messages = $("#messages"),
    chatWelcome = $("#chatWelcome"),
    chatScroll = $("#chatScroll"),
    historyEl = document.querySelector(".workspace-history");

  function toast(text) {
    const t = $("#toast");
    t.textContent = text;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2000);
  }
  function enterMotion(el) {
    el.classList.remove("route-in");
    void el.offsetWidth;
    el.classList.add("route-in");
  }
  function showHome() {
    workspace.classList.add("hidden");
    landing.classList.remove("hidden");
    enterMotion(landing);
    window.scrollTo(0, 0);
    workspace.classList.remove("mobile-open");
    $("#mainNav").classList.remove("open");
    $("#navScrim").classList.remove("active");
  }
  function showDashboard() {
    landing.classList.add("hidden");
    workspace.classList.remove("hidden");
    enterMotion(workspace);
    dashView.classList.remove("hidden");
    chatView.classList.remove("active");
    $("#workspaceCrumb").textContent = "RuangAI / Dashboard";
    $("#navDash").classList.add("active");
    $("#navNewChat").classList.remove("active");
    workspace.classList.remove("mobile-open");
    window.scrollTo(0, 0);
  }
  function showChat() {
    landing.classList.add("hidden");
    workspace.classList.remove("hidden");
    enterMotion(workspace);
    dashView.classList.add("hidden");
    chatView.classList.add("active");
    $("#workspaceCrumb").textContent = "RuangAI / Chat";
    $("#navDash").classList.remove("active");
    $("#navNewChat").classList.add("active");
    workspace.classList.remove("mobile-open");
    setTimeout(() => input.focus(), 40);
  }

  // ---- Riwayat percakapan (tersimpan di browser, tanpa server) ----
  const STORE_KEY = "ruangai.conversations.v1";
  let conversations = [];
  try {
    conversations = JSON.parse(localStorage.getItem(STORE_KEY)) || [];
    if (!Array.isArray(conversations)) conversations = [];
    conversations = conversations.filter(c => c && typeof c.id === "string" && typeof c.title === "string" && Array.isArray(c.messages)).slice(0, 40);
    conversations.forEach(c => {
      c.messages = c.messages.filter(m => m && ["user", "ai", "assistant"].includes(m.role) && typeof m.content === "string").map(m => ({ role: m.role === "assistant" ? "ai" : m.role, content: m.content }));
    });
  } catch (e) {
    conversations = [];
  }
  let current = null;
  let pendingTitle = null;

  function persist() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(conversations.slice(0, 40)));
    } catch (e) {
      /* penyimpanan penuh/di-nonaktifkan: riwayat hanya tampil selama sesi */
    }
  }
  function titleFrom(text) {
    const t = String(text).replace(/\s+/g, " ").trim().slice(0, 48);
    return t || "Percakapan baru";
  }
  function ensureCurrent(firstText) {
    if (!current) {
      current = {
        id: String(Date.now()) + Math.random().toString(36).slice(2, 6),
        title: pendingTitle || titleFrom(firstText),
        messages: [],
      };
      conversations.unshift(current);
      pendingTitle = null;
      $("#chatTitle").textContent = current.title;
    }
    return current;
  }
  function renderHistory() {
    if (!historyEl) return;
    historyEl.innerHTML = "";
    if (!conversations.length) {
      const p = document.createElement("p");
      p.className = "history-empty";
      p.textContent = "Belum ada percakapan.";
      historyEl.appendChild(p);
      return;
    }
    conversations.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.title = c.title;
      b.classList.toggle("active", current?.id === c.id);
      if (current?.id === c.id) b.setAttribute("aria-current", "true");
      b.innerHTML = '<iconify-icon icon="lucide:message-circle" aria-hidden="true"></iconify-icon>';
      const title = document.createElement("span");
      title.className = "history-title";
      title.textContent = c.title;
      b.appendChild(title);
      b.addEventListener("click", () => openConversation(c.id));
      historyEl.appendChild(b);
    });
  }
  function openConversation(id) {
    if (sending) return toast("Tunggu sampai jawaban selesai sebelum mengganti percakapan.");
    const c = conversations.find((x) => x.id === id);
    if (!c) return;
    current = c;
    renderHistory();
    messages.innerHTML = "";
    chatWelcome.classList.add("hidden");
    $("#chatTitle").textContent = c.title;
    c.messages.forEach((m) => appendMessage(m.content, m.role, false));
    showChat();
    chatScroll.scrollTop = chatScroll.scrollHeight;
  }

  function aiIcon() {
    return '<span class="ai-mark"><iconify-icon icon="lucide:sparkles" aria-hidden="true"></iconify-icon></span>';
  }
  function appendMessage(text, role, track) {
    if (track === undefined) track = true;
    const row = document.createElement("div");
    row.className = "message " + role;
    const b = document.createElement("div");
    b.className = "bubble";
    if (role === "ai" && typeof window.renderAIMessage === "function") {
      b.classList.add("markdown-body");
      b.innerHTML = window.renderAIMessage(text);
    } else {
      b.textContent = text;
    }
    if (role === "ai") row.innerHTML = aiIcon();
    row.appendChild(b);
    if (role === "user") {
      const avatar = document.createElement("span");
      avatar.className = "avatar";
      avatar.textContent = "MR";
      row.appendChild(avatar);
    }
    messages.appendChild(row);
    chatScroll.scrollTop = chatScroll.scrollHeight;
    if (track && current) current.messages.push({ role: role, content: text });
    return row;
  }

  async function callAI(history) {
    let lastErr = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      let timer;
      try {
        const ctrl = new AbortController();
        timer = setTimeout(() => ctrl.abort(), 90000);
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history.slice(-20).map(m => ({ role: m.role === "ai" ? "assistant" : m.role, content: m.content })) }),
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        let data = null;
        try {
          data = await res.json();
        } catch (e) {
          data = null;
        }
        if (!res.ok) {
          throw Object.assign(new Error((data && data.error) || "Server bermasalah (HTTP " + res.status + ")."), { status: res.status });
        }
        if (!data || typeof data.reply !== "string" || !data.reply.trim()) {
          throw new Error("Server tidak mengirim balasan.");
        }
        return data.reply.trim();
      } catch (err) {
        lastErr = err;
        console.error("[RuangAI] percobaan " + (attempt + 1) + " gagal:", err);
        if (err && err.name === "AbortError") {
          throw new Error("Batas waktu habis (90 dtk). Silakan coba lagi.");
        }
        if (err.status) throw err;
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 800));
        }
      } finally {
        clearTimeout(timer);
      }
    }
    if (lastErr instanceof TypeError) {
      throw new Error("Tidak dapat tersambung ke server. Pastikan server RuangAI berjalan di port 3000.");
    }
    throw lastErr || new Error("Tidak dapat tersambung ke server.");
  }

  let sending = false;
  async function sendMessage(text) {
    const q = (text || input.value).trim();
    if (!q || sending) return;
    if (q.length > 8000) return toast("Pesan maksimal 8000 karakter.");
    showChat();
    chatWelcome.classList.add("hidden");
    input.value = "";
    input.style.height = "auto";
    ensureCurrent(q);
    const conversation = current;
    appendMessage(q, "user");
    persist();
    renderHistory();
    sending = true;
    const sendBtn = $("#send");
    sendBtn.disabled = true;
    input.disabled = true;
    setStatus("Menyiapkan jawaban…", "loading");
    const wait = document.createElement("div");
    wait.className = "message ai";
    wait.innerHTML =
      aiIcon() +
      '<div class="bubble"><div class="loading-copy">RuangAI sedang menyusun jawaban</div><div class="typing"><i></i><i></i><i></i></div></div>';
    messages.appendChild(wait);
    chatScroll.scrollTop = chatScroll.scrollHeight;
    try {
      const reply = await callAI(conversation.messages);
      wait.remove();
      appendMessage(reply, "ai");
      setStatus("Terhubung ke Gemini", "ready");
    } catch (err) {
      wait.remove();
      const errorRow = appendMessage("Balasan belum tersedia. " + (err && err.message ? err.message : "Terjadi kesalahan."), "error", false);
      errorRow.setAttribute("role", "alert");
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "retry-message";
      retry.textContent = "Coba lagi";
      retry.onclick = () => {
        if (sending || current !== conversation) return;
        conversation.messages.pop();
        errorRow.previousElementSibling?.remove();
        errorRow.remove();
        sendMessage(q);
      };
      errorRow.querySelector(".bubble").appendChild(retry);
      setStatus("Koneksi bermasalah", "error");
      toast("Gagal mendapatkan balasan");
    } finally {
      sending = false;
      sendBtn.disabled = false;
      input.disabled = false;
      persist();
      renderHistory();
      input.focus();
    }
  }

  function newChat(title) {
    if (sending) return toast("Tunggu sampai jawaban selesai sebelum membuat percakapan baru.");
    persist();
    current = null;
    renderHistory();
    pendingTitle = title || null;
    messages.innerHTML = "";
    chatWelcome.classList.remove("hidden");
    $("#chatTitle").textContent = title || "Percakapan baru";
    showChat();
  }

  renderHistory();
  function setStatus(text, state) {
    const status = $(".chat-status");
    status.textContent = text;
    status.dataset.state = state;
  }
  async function checkConnection() {
    try {
      const res = await fetch("/api/health", { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (!sending) setStatus(data.configured ? "Gemini dikonfigurasi" : "API key belum diisi", data.configured ? "configured" : "error");
    } catch {
      if (!sending) setStatus("Server tidak terhubung", "error");
    }
  }
  checkConnection();

  document.querySelectorAll("[data-dashboard]").forEach((b) =>
    b.addEventListener("click", (e) => {
      if (b.tagName === "A") e.preventDefault();
      showDashboard();
    })
  );
  document.querySelectorAll("[data-home]").forEach((b) =>
    b.addEventListener("click", (e) => {
      e.preventDefault();
      showHome();
    })
  );
  $("#mobileMenu").onclick = () => {
    const open = $("#mainNav").classList.toggle("open");
    $("#mobileMenu").setAttribute("aria-expanded", String(open));
    $("#navScrim").classList.toggle("active", open);
  };
  $("#navScrim").onclick = () => {
    $("#mainNav").classList.remove("open");
    $("#navScrim").classList.remove("active");
  };
  document.querySelectorAll("#mainNav a").forEach((a) =>
    a.addEventListener("click", () => {
      $("#mainNav").classList.remove("open");
      $("#navScrim").classList.remove("active");
    })
  );
  $("#navDash").onclick = showDashboard;
  $("#navNewChat").onclick = () => newChat();
  $("#dashStart").onclick = () => newChat();
  $("#dashContinue").onclick = () => newChat();
  $("#send").onclick = () => sendMessage();
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      sendMessage();
    }
  });
  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 100) + "px";
  });
  document.querySelectorAll("[data-chat-prompt]").forEach((b) =>
    b.addEventListener("click", () => sendMessage(b.dataset.chatPrompt))
  );
  document.querySelectorAll("[data-history]").forEach((b) =>
    b.addEventListener("click", () => newChat(b.dataset.history))
  );
  $("#workspaceMenu").onclick = () => workspace.classList.toggle("mobile-open");
  $("#overlay").onclick = () => workspace.classList.remove("mobile-open");
  $("#attach").onclick = () => toast("Lampiran file belum tersedia pada versi ini.");
  $("#mic").onclick = () => toast("Input suara belum tersedia pada versi ini.");

  let wizardStep = 1,
    wizardGoal = "",
    wizardFormat = "",
    wizardContext = "";
  const wizard = $("#guidedModal");
  const wizardTitles = [
    "Kamu ingin dibantu untuk apa?",
    "Ceritakan sedikit konteksnya",
    "Seperti apa jawaban yang kamu inginkan?",
    "Pertanyaanmu sudah siap",
  ];
  const wizardSubtitles = [
    "Pilih tujuan yang paling mendekati kebutuhanmu.",
    "Detail secukupnya membantu AI memberi jawaban yang lebih relevan.",
    "Pilih cara penyampaian yang paling nyaman untukmu.",
    "Periksa rangkuman pertanyaan sebelum memulai percakapan.",
  ];
  function buildPrompt() {
    return (
      "Saya ingin bantuan untuk " +
      wizardGoal +
      ".\n\nKonteks: " +
      wizardContext.trim() +
      "\n\nTolong sajikan jawaban " +
      wizardFormat +
      "."
    );
  }
  function refreshWizard() {
    document
      .querySelectorAll(".wizard-panel")
      .forEach((p) => p.classList.toggle("active", Number(p.dataset.wizardStep) === wizardStep));
    $("#wizardStepLabel").textContent = "Langkah " + wizardStep + " dari 4";
    $("#wizardTitle").textContent = wizardTitles[wizardStep - 1];
    $("#wizardSubtitle").textContent = wizardSubtitles[wizardStep - 1];
    $("#wizardProgress").style.width = wizardStep * 25 + "%";
    $("#wizardBack").disabled = wizardStep === 1;
    $("#wizardNext").disabled =
      (wizardStep === 1 && !wizardGoal) ||
      (wizardStep === 2 && wizardContext.trim().length < 3) ||
      (wizardStep === 3 && !wizardFormat);
    $("#wizardNext").innerHTML =
      wizardStep === 4
        ? 'Mulai percakapan <iconify-icon icon="lucide:arrow-right" aria-hidden="true"></iconify-icon>'
        : 'Lanjutkan <iconify-icon icon="lucide:arrow-right" aria-hidden="true"></iconify-icon>';
    if (wizardStep === 4) $("#wizardPreview").textContent = buildPrompt();
  }
  let wizardReturnFocus = null;
  function openWizard() {
    wizardReturnFocus = document.activeElement;
    wizardStep = 1;
    wizardGoal = "";
    wizardFormat = "";
    wizardContext = "";
    $("#wizardContext").value = "";
    $("#contextCount").textContent = "0/400";
    document.querySelectorAll("[data-goal],[data-format]").forEach((b) => b.setAttribute("aria-pressed", "false"));
    refreshWizard();
    wizard.classList.add("open");
    wizard.setAttribute("aria-hidden", "false");
    document.body.classList.add("wizard-open");
    setTimeout(() => $("#wizardClose").focus(), 80);
  }
  function closeWizard() {
    wizard.classList.remove("open");
    wizard.setAttribute("aria-hidden", "true");
    document.body.classList.remove("wizard-open");
    if (wizardReturnFocus && wizardReturnFocus.focus) wizardReturnFocus.focus();
  }
  $("#dashGuided").onclick = openWizard;
  $("#guidedStart").onclick = openWizard;
  $("#wizardClose").onclick = closeWizard;
  wizard.addEventListener("click", (e) => {
    if (e.target === wizard) closeWizard();
  });
  $("#wizardBack").onclick = () => {
    if (wizardStep > 1) {
      wizardStep--;
      refreshWizard();
    }
  };
  $("#wizardNext").onclick = () => {
    if (wizardStep < 4) {
      if (wizardStep === 3 && !wizardFormat) return;
      wizardStep++;
      refreshWizard();
    } else {
      if (sending) return toast("Tunggu sampai jawaban selesai sebelum memulai percakapan baru.");
      const prompt = buildPrompt();
      closeWizard();
      newChat();
      sendMessage(prompt);
    }
  };
  document.querySelectorAll("[data-goal]").forEach((b) => (b.onclick = () => {
    wizardGoal = b.dataset.goal;
    document.querySelectorAll("[data-goal]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    refreshWizard();
  }));
  document.querySelectorAll("[data-format]").forEach((b) => (b.onclick = () => {
    wizardFormat = b.dataset.format;
    document.querySelectorAll("[data-format]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    refreshWizard();
  }));
  $("#wizardContext").addEventListener("input", (e) => {
    wizardContext = e.target.value;
    $("#contextCount").textContent = wizardContext.length + "/400";
    refreshWizard();
  });

  const revealObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      }),
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
  document.querySelectorAll(".feature-card,.how-step,.usecase,.workspace-quick>button,.recent-btn").forEach((el, i) => {
    el.classList.add("reveal-child");
    el.style.setProperty("--stagger-index", i % 4);
  });

  let scrollTick = false;
  window.addEventListener(
    "scroll",
    () => {
      if (scrollTick) return;
      scrollTick = true;
      requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
        $("#scrollProgress").style.width = pct + "%";
        $("#backToTop").classList.toggle("visible", window.scrollY > 520 && !landing.classList.contains("hidden"));
        document.querySelectorAll(".parallax-layer").forEach((layer) => {
          const box = layer.closest("section").getBoundingClientRect();
          const ratio = window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? 0
            : Number(layer.dataset.parallax || 0.1);
          const progress = (window.innerHeight - box.top) / (window.innerHeight + box.height) - 0.5;
          layer.style.setProperty("--parallax-y", progress * 110 * ratio + "px");
        });
        scrollTick = false;
      });
    },
    { passive: true }
  );
  $("#backToTop").onclick = () =>
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k" && !workspace.classList.contains("hidden")) {
      e.preventDefault();
      newChat();
    }
    if (e.key === "Escape" && wizard.classList.contains("open")) closeWizard();
    if (e.key === "Escape") {
      $("#mainNav").classList.remove("open");
      $("#mobileMenu").setAttribute("aria-expanded", "false");
      $("#navScrim").classList.remove("active");
      workspace.classList.remove("mobile-open");
    }
  });
})();

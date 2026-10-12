const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const gemini = require("./gemini");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const publicDir = path.join(__dirname, "..", "public");

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const SYSTEM = [
  "Kamu adalah RuangAI, asisten AI berbahasa Indonesia yang ramah, jelas, dan membantu.",
  "Informasi resmi pembuat aplikasi ini: Muhammad Rasyad adalah orang yang membuat RuangAI. Ia lulusan D3 Teknik Informatika di Politeknik Negeri Banjarmasin, sekarang bekerja sebagai Programmer di PPA ONE, dan sedang melanjutkan studi di Universitas Siber Asia.",
  "Jika pengguna bertanya siapa Muhammad Rasyad atau siapa pembuat aplikasi ini, jelaskan profil tersebut secara langsung. Jangan mengarang rincian biografi lain yang tidak diberikan.",
  "Jawab dalam Bahasa Indonesia natural (kecuali pengguna memakai bahasa lain).",
  "Bantu pengguna belajar, menulis, menyusun ide dan rencana, serta memahami hal baru.",
  "Jaga jawaban tetap ringkas, terstruktur, dan praktis; tawarkan langkah berikutnya bila cocok.",
  "Jujur: bila kamu tidak yakin, katakan terus terang dan sarankan pengguna memverifikasi informasi penting.",
].join(" ");

function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const out = [];
  for (const m of raw.slice(-20)) {
    if (!m || typeof m !== "object") continue;
    if (!["user", "assistant", "ai"].includes(m.role)) continue;
    const role = m.role === "assistant" || m.role === "ai" ? "assistant" : "user";
    const content = typeof m.content === "string" ? m.content.trim().slice(0, 8000) : "";
    if (!content) continue;
    const prev = out[out.length - 1];
    if (prev && prev.role === role) prev.content = (prev.content + "\n" + content).slice(0, 8000);
    else out.push({ role, content });
  }
  while (out.length && out[0].role !== "user") out.shift();
  return out.length && out[out.length - 1].role === "user" ? out : null;
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, configured: gemini.isConfigured(), model: gemini.getModel() });
});

app.post("/api/chat", async (req, res) => {
  try {
    const messages = sanitizeMessages((req.body || {}).messages);
    if (!messages) return res.status(400).json({ error: "Pesan kosong." });
    const history = messages.slice(0, -1);
    const message = messages[messages.length - 1].content;
    const { text } = await gemini.chat({ system: SYSTEM, history, message });
    if (!text || !text.trim()) throw new Error("Model tidak mengirim balasan.");
    res.json({ reply: text.trim() });
  } catch (e) {
    if (e.code === "NO_API_KEY") return res.status(503).json({ error: e.message });
    if (e.code === "RATE_LIMIT") return res.status(429).json({ error: e.message });
    console.error("POST /api/chat:", e.code || "INTERNAL_ERROR");
    const known = ["INVALID_API_KEY", "MODEL_NOT_FOUND", "INVALID_REQUEST", "UPSTREAM_UNAVAILABLE", "NETWORK_ERROR", "EMPTY_RESPONSE", "TIMEOUT"].includes(e.code);
    res.status(e.code === "TIMEOUT" ? 504 : known ? 502 : 500).json({ error: known ? e.message : "Terjadi kesalahan pada server. Silakan coba lagi." });
  }
});

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(publicDir, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.json({ ok: true, info: "Folder public/ belum ada." });
  });
}

app.use((err, req, res, next) => {
  res.status(err.type === "entity.too.large" ? 413 : 400).json({ error: "Format atau ukuran permintaan tidak valid." });
});
if (require.main === module) app.listen(PORT, () => console.log(`RuangAI jalan di http://localhost:${PORT}`));
module.exports = { app, sanitizeMessages };

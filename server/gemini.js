// Gemini REST API, kompatibel dengan Node 18.
const https = require("https");
const DEFAULT_MODEL = "gemini-3-flash-preview";
const getModel = () => (process.env.GEMINI_MODEL || DEFAULT_MODEL).trim().replace(/^models\//, "");
const isConfigured = () => Boolean((process.env.GEMINI_API_KEY || "").trim());
function apiError(status) {
  const errors = {
    400: ["INVALID_REQUEST", "Permintaan ditolak Gemini. Periksa konfigurasi model dan API key."],
    401: ["INVALID_API_KEY", "API key Gemini tidak valid. Periksa server/.env."],
    403: ["INVALID_API_KEY", "API key tidak memiliki izin mengakses Gemini. Periksa server/.env."],
    404: ["MODEL_NOT_FOUND", "Model Gemini tidak tersedia. Periksa GEMINI_MODEL di server/.env."],
    429: ["RATE_LIMIT", "Kuota Gemini habis atau batas pemakaian tercapai. Coba lagi setelah kuota tersedia."],
    500: ["UPSTREAM_UNAVAILABLE", "Layanan Gemini sedang bermasalah. Silakan coba lagi."],
    503: ["UPSTREAM_UNAVAILABLE", "Layanan Gemini sedang sibuk. Silakan coba lagi."],
  };
  const [code, message] = errors[status] || ["UPSTREAM_UNAVAILABLE", "Tidak dapat memperoleh balasan dari Gemini."];
  return Object.assign(new Error(message), { code, status });
}
function generate(payload) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "generativelanguage.googleapis.com",
      path: "/v1beta/models/" + encodeURIComponent(getModel()) + ":generateContent",
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY.trim() },
    }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", chunk => { body += chunk; });
      res.on("error", () => reject(apiError(503)));
      res.on("end", () => {
        if (res.statusCode !== 200) return reject(apiError(res.statusCode));
        try { resolve(JSON.parse(body)); } catch { reject(apiError(502)); }
      });
    });
    const timer = setTimeout(() => req.destroy(Object.assign(new Error("Gemini terlalu lama merespons. Silakan coba lagi."), { code: "TIMEOUT" })), 35000);
    req.on("close", () => clearTimeout(timer));
    req.on("error", err => reject(err.code === "TIMEOUT" ? err : Object.assign(new Error("Tidak dapat terhubung ke Gemini. Periksa koneksi internet server."), { code: "NETWORK_ERROR" })));
    req.end(JSON.stringify(payload));
  });
}
async function chat({ system, history = [], message, tools }) {
  if (!isConfigured()) throw Object.assign(new Error("GEMINI_API_KEY belum diisi di server/.env."), { code: "NO_API_KEY" });
  const payload = {
    contents: [...history.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })), { role: "user", parts: [{ text: message }] }],
  };
  if (system) payload.systemInstruction = { parts: [{ text: system }] };
  if (tools) payload.tools = tools;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await generate(payload);
      const candidate = (response.candidates || [])[0];
      const text = (candidate?.content?.parts || []).filter(p => !p.thought && typeof p.text === "string").map(p => p.text).join("");
      if (!text.trim()) throw Object.assign(new Error("Gemini tidak mengirim jawaban. Coba ubah pertanyaanmu."), { code: "EMPTY_RESPONSE" });
      return { text, groundingMeta: candidate?.groundingMetadata };
    } catch (err) {
      if (![500, 503].includes(err.status) || attempt === 1) throw err;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
module.exports = { chat, getModel, isConfigured };

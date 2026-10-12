const assert = require("node:assert/strict");
const gemini = require("../server/gemini");
const { app, sanitizeMessages } = require("../server/index");

async function run() {
  assert.deepEqual(sanitizeMessages([
    { role: "user", content: "Halo" },
    { role: "ai", content: "Halo kembali" },
    { role: "user", content: "Lanjut" },
  ]).map(m => m.role), ["user", "assistant", "user"]);
  assert.equal(sanitizeMessages([{ role: "assistant", content: "Balasan" }]), null);
  assert.equal(sanitizeMessages([{ role: "system", content: "Instruksi" }]), null);
  assert.equal(sanitizeMessages([{ role: "user", content: "x".repeat(8000) }, { role: "user", content: "y".repeat(8000) }])[0].content.length, 8000);
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  const original = gemini.chat;
  const originalKey = process.env.GEMINI_API_KEY;
  const post = body => fetch(base + "/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  try {
    assert.equal((await fetch(base + "/")).status, 200);
    process.env.GEMINI_API_KEY = "";
    assert.equal((await (await fetch(base + "/api/health")).json()).configured, false);
    assert.equal((await post({ messages: [{ role: "user", content: "Halo" }] })).status, 503);
    assert.equal((await post({ messages: [] })).status, 400);
    gemini.chat = async args => {
      assert.equal(args.history[1].role, "assistant");
      return { text: "Balasan uji" };
    };
    const response = await post({ messages: [{ role: "user", content: "Halo" }, { role: "ai", content: "Hai" }, { role: "user", content: "Lanjut" }] });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).reply, "Balasan uji");
    for (const [code, status] of [["RATE_LIMIT", 429], ["MODEL_NOT_FOUND", 502], ["TIMEOUT", 504]]) {
      gemini.chat = async () => { throw Object.assign(new Error("Uji kegagalan"), { code }); };
      assert.equal((await post({ messages: [{ role: "user", content: "Halo" }] })).status, status);
    }
    const invalid = await fetch(base + "/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" });
    assert.equal(invalid.status, 400);
    assert.equal(typeof (await invalid.json()).error, "string");
    console.log("PASS: static UI, history roles, limits, health, chat and error responses");
  } finally {
    gemini.chat = original;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}
run().catch(err => { console.error(err); process.exitCode = 1; });

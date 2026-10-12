# RuangAI — Asisten AI untuk ide Indonesia

RuangAI adalah asisten AI berbahasa Indonesia: landing page merah-putih,
dashboard percakapan, dan chat yang tersambung ke AI sungguhan (Google Gemini)
melalui backend lokal. Seluruh kunci API berada di server — tidak ada secret di browser.

## Fitur

- **Landing page**: hero peta Nusantara dengan parallax, maskot burung Garuda
  (dari sprite `office-characters.png`), fitur, alur langkah, FAQ.
  Animasi menghormati `prefers-reduced-motion`.
- **Dashboard**: prompt cepat, kartu "Percakapan terbaru", tip harian.
- **Chat**: alur panduan "Tanya bertahap" (wizard 4 langkah), kirim dengan
  Enter, cegah pengiriman ganda, indikator loading, pesan error yang jujur.
- **Riwayat**: tersimpan di `localStorage` browser, tampil di sidebar.
- **Balasan AI asli** lewat `POST /api/chat` → Gemini.
  Tanpa API key atau kena rate limit, server memberi pesan jujur — bukan jawaban palsu.

## Menjalankan

Gunakan Node.js 18 atau lebih baru. Backend memakai Gemini REST API agar
tidak bergantung pada SDK yang membutuhkan Node 20.
Jalankan `npm test` untuk memeriksa endpoint chat, riwayat, dan respons error.

```powershell
npm install            # esbuild (root)
npm run build          # src/ui.tsx → public/ui.js
cd server && npm install && cd ..
npm start              # http://localhost:3000
```

Akses: `http://localhost:3000/` atau `http://dailyai.test/`
(reverse proxy Laragon → port 3000).

Butuh `server/.env`:

```
GEMINI_API_KEY=<kunci dari https://aistudio.google.com/apikey>
GEMINI_MODEL=gemini-3-flash-preview
PORT=3000
```

## Struktur

- `public/` — situs statis (`index.html`, `chat.js`, `ui.js`, `assets/`)
- `src/ui.tsx` — komponen header/journey/maskot (build ke `public/ui.js`)
- `server/` — Express: `POST /api/chat` (Gemini), `GET /api/health`, static file
- `AGENTS.md` — panduan lengkap untuk agen AI & deployment (baca sebelum ubah kode)

## Batasan jujur

- Tombol lampiran dan mikrofon belum berfungsi (menampilkan pemberitahuan).
- Jawaban AI bisa keliru — selalu periksa informasi penting.
- Riwayat percakapan tersimpan di browser saja (tidak di server).

## Kredit

Dirancang untuk **Muhammad Rasyad — Developer Programmer PPA ONE**.

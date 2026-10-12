# AGENTS.md — Panduan Agen & Deployment RuangAI

File ini untuk agen AI (dan developer) yang mengembangkan/men-deploy RuangAI.
Baca ini sebelum mengubah kode.

## Struktur Proyek

```
dailyai/
├── public/                  ← situs statis (disajikan Express)
│   ├── index.html           ← markup + seluruh CSS (inline <style>)
│   ├── chat.js              ← logika dashboard, wizard, chat, riwayat
│   ├── ui.js                ← hasil build esbuild dari src/ui.tsx
│   └── assets/
│       ├── indonesia-archipelago.png   ← peta Nusantara (hero + parallax)
│       ├── office-characters.png       ← sprite sheet maskot (4×4 grid)
│       ├── map-open-office.png         ← opsional: peta kantor
│       ├── map-meeting-room.png
│       ├── map-break-room.png
│       └── map-server-room.png
├── src/
│   └── ui.tsx             ← komponen Header, Journey, Mascot (TSX)
├── scripts/
│   └── build.mjs          ← esbuild: src/ui.tsx → public/ui.js
├── server/
│   ├── index.js           ← Express: static public/ + POST /api/chat
│   ├── gemini.js          ← wrapper Gemini (retry/backoff 429/503)
│   ├── .env               ← GEMINI_API_KEY, GEMINI_MODEL, PORT
│   └── package.json
├── _backup_dailyai/       ← arsip aplikasi DailyAI lama (jangan dihapus)
├── package.json           ← scripts: build (esbuild), start (node server/index.js)
└── start-dailyai.bat / stop-dailyai.bat
```

## Cara Menjalankan (lokal, Laragon)

```powershell
cd C:\laragon\www\dailyai
npm install                 # esbuild (root)
npm run build               # compile src/ui.tsx → public/ui.js
cd server; npm install; cd ..
npm start                   # Express di http://localhost:3000
```

Akses: `http://localhost:3000/` atau `http://dailyai.test/`
(Apache Laragon reverse-proxy `dailyai.test` → `127.0.0.1:3000`;
konfigurasi di `C:\laragon\etc\apache2\sites-enabled\dailyai.test.conf`.)

## Cara Build Setelah Ubah UI

- Ubah **`public/index.html`** langsung untuk markup/CSS/teks (tidak perlu build).
- Ubah **`public/chat.js`** langsung (plain JS, tidak perlu build).
- Ubah **`src/ui.tsx`** → wajib `npm run build` (menulis `public/ui.js`).

## Mengganti Maskot Garuda (sprite sheet)

Maskot = 1 cell dari `public/assets/office-characters.png` (grid 4×4).
Atur di `public/index.html`, class `.mascot-bird`:

```css
.mascot-bird{
  background-image:url("assets/office-characters.png");
  background-size:400% 400%;      /* 4 kolom × 4 baris */
  background-position:0% 0%;      /* ← ganti ini */
  image-rendering:pixelated;
}
```

Posisi cell (kolom, baris), 0-indexed:

| Cell | background-position |
|------|-------------------|
| [0,0] | `0% 0%` |
| [1,0] | `33.333% 0%` |
| [2,0] | `66.667% 0%` |
| [3,0] | `100% 0%` |
| [0,1] | `0% 33.333%` |
| [1,1] | `33.333% 33.333%` |
| ...  | (kolom/3 × 100)% (baris/3 × 100)% |

Cell lama DailyAI: umum=[1,1], job=[0,1], dokumen=[1,0], keuangan=[3,1], meal=[3,0].
Ganti `background-position` untuk memilih karakter lain.

## Parallax

Elemen dengan class `parallax-layer` + atribut `data-parallax="0.2"` (0–1)
bergerak vertikal saat scroll, dikendalikan `chat.js` (scroll handler).
`prefers-reduced-motion: reduce` → parallax otomatis mati.

## Backend Chat

`POST /api/chat` body: `{"messages":[{"role":"user","content":"..."},...]}`
- Riwayat dibatasi 20 pesan terakhir, tiap pesan max 8000 karakter.
- System prompt RuangAI ada di `server/index.js` (konstanta `SYSTEM`).
- Kunci API **hanya** di `server/.env` — jangan pernah di browser/HTML/JS/bundle.
- Error jujur: tanpa kunci → HTTP 503; rate limit → HTTP 429.

## Deployment ke Server Lain

1. Salin seluruh folder `dailyai/` (kecuali `node_modules/`, `_backup_dailyai/` opsional).
2. `npm install` di root dan di `server/`.
3. Isi `server/.env`: `GEMINI_API_KEY=...`, `GEMINI_MODEL=gemini-3.8-flash`, `PORT=3000`.
4. Jalankan `npm start` (atau pm2: `pm2 start ecosystem.config.js`).
5. Opsional: reverse proxy domain ke port 3000 (contoh nginx di `nginx-dailyai.conf`).

## Aturan Penting

- **Jangan** menaruh API key/secret di kode frontend.
- **Jangan** menampilkan jawaban seolah dari AI bila koneksi belum dikonfigurasi.
- Pertahankan UI loading, pesan error yang mudah dipahami, pencegahan kirim ganda.
- Jangan kirim isi chat ke layanan eksternal selain gateway yang dikonfigurasi.
- Jika deploy diblokir kebijakan, **berhenti dan laporkan** — jangan cari jalur alternatif.

## Kredit

Muhammad Rasyad — Developer Programmer PPA ONE.

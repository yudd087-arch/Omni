# Omni Flash Generator

Web app responsif untuk mengirim foto, video referensi, dan prompt ke Nexabot Omni Flash 1.2 (mode `r2v`), memantau job, lalu menampilkan dan mengunduh hasil MP4.

## Penting
- API key Nexabot hanya dipasang di server melalui environment variable `NEXABOT_API_KEY`.
- Jangan menaruh API key di `public/app.js`, HTML, atau membagikannya di chat.
- Implementasi ini mengikuti endpoint dan payload yang ada pada kode Pipedream yang diberikan: `POST /api/v1/api`, `GET /api/v1/jobs/:jobId`, dan `GET /api/v1/jobs/:jobId/download`.
- Batas upload awal adalah 50 MB per file. Ini dapat disesuaikan pada `server.js`, dengan memperhatikan batas Nexabot dan kapasitas hosting.
- Polling menunggu maksimal 6 menit. Sesuaikan bila durasi job biasanya lebih lama.

## Menjalankan lokal
1. Install Node.js versi 18 atau lebih baru.
2. Ekstrak ZIP dan buka folder proyek.
3. Jalankan `npm install`.
4. Salin `.env.example` menjadi `.env`.
5. Isi `NEXABOT_API_KEY` di `.env`.
6. Jalankan `npm start`.
7. Buka `http://localhost:3000`.

## Deploy agar bisa dibuka lewat link HP (contoh: Render)
1. Buat repository GitHub pribadi dan unggah isi folder proyek ini.
2. Di Render, buat **New Web Service** dan hubungkan repository tersebut.
3. Build command: `npm install`
4. Start command: `npm start`
5. Tambahkan environment variable `NEXABOT_API_KEY` dengan API key Nexabot milikmu di pengaturan Render. Jangan menaruhnya di source code.
6. Deploy. Buka URL HTTPS yang diberikan Render dari HP.

## Catatan kompatibilitas
Format status job dan respons download mengikuti pola yang dipakai kode Pipedream awal. Jika dokumentasi Nexabot memakai status/format berbeda, bagian pemeriksaan status atau download mungkin perlu disesuaikan berdasarkan respons API yang sebenarnya.

# Cara Deploy ke Vercel

Versi ini sudah ditambah proxy Vercel di `api/parse.js`.

## Alur kerja

- Di `localhost`, website tetap direct ke `https://api.vidssave.com/...`.
- Di Vercel/domain sendiri, website otomatis pakai `/api/parse`.
- `/api/parse` yang akan request ke provider, jadi browser tidak kena CORS.

## Struktur penting

```txt
index.html
app.js
api/parse.js
package.json
```

## Deploy

1. Upload semua file/folder ke GitHub.
2. Pastikan folder `api` ikut ter-upload.
3. Di Vercel, import repo GitHub.
4. Framework Preset: Other.
5. Build Command kosongkan.
6. Output Directory kosongkan / default.
7. Deploy.

Kalau di Vercel masih gagal, buka DevTools > Network dan cek request `/api/parse`.

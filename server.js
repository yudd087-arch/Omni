require("dotenv").config();

const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.NEXABOT_API_KEY;
const API_BASE = "https://nexabot.id/api/v1";

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 2
  }
});

function requireApiKey(req, res, next) {
  if (!API_KEY) {
    return res.status(500).json({
      error: "API Key Nexabot belum dipasang di environment server."
    });
  }
  next();
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

app.post(
  "/api/generate",
  requireApiKey,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const image = req.files?.image?.[0];
      const video = req.files?.video?.[0];
      const prompt = (req.body.prompt || "").trim();

      if (!image || !video || !prompt) {
        return res.status(400).json({
          error: "Foto, video referensi, dan prompt wajib diisi."
        });
      }

      if (!image.mimetype.startsWith("image/")) {
        return res.status(400).json({ error: "File foto harus berupa gambar." });
      }

      if (!video.mimetype.startsWith("video/")) {
        return res.status(400).json({ error: "File referensi harus berupa video." });
      }

      const imageData = `data:${image.mimetype};base64,${image.buffer.toString("base64")}`;
      const videoData = `data:${video.mimetype};base64,${video.buffer.toString("base64")}`;

      const upstream = await fetch(`${API_BASE}/api`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY
        },
        body: JSON.stringify({
          model: "omni_flash",
          mode: "r2v",
          prompt,
          ratio: 2,
          resolution: 720,
          media: [videoData, imageData]
        })
      });

      const raw = await upstream.text();
      const data = safeJson(raw);

      if (!upstream.ok || !data.job_id) {
        return res.status(upstream.status || 502).json({
          error: data.error || data.message || "Nexabot gagal menerima permintaan.",
          details: data
        });
      }

      return res.json({ success: true, jobId: data.job_id });
    } catch (error) {
      console.error("Generate error:", error);
      return res.status(500).json({
        error: error.message || "Terjadi kesalahan saat mengirim permintaan."
      });
    }
  }
);

app.get("/api/jobs/:jobId", requireApiKey, async (req, res) => {
  try {
    const jobId = encodeURIComponent(req.params.jobId);
    const upstream = await fetch(`${API_BASE}/jobs/${jobId}`, {
      headers: { "x-api-key": API_KEY }
    });

    const raw = await upstream.text();
    const data = safeJson(raw);

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data.error || data.message || "Gagal memeriksa status job."
      });
    }

    return res.json(data.job ?? data);
  } catch (error) {
    console.error("Status error:", error);
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/jobs/:jobId/download", requireApiKey, async (req, res) => {
  try {
    const jobId = encodeURIComponent(req.params.jobId);
    const upstream = await fetch(`${API_BASE}/jobs/${jobId}/download`, {
      headers: { "x-api-key": API_KEY }
    });

    if (!upstream.ok) {
      const raw = await upstream.text();
      const data = safeJson(raw);
      return res.status(upstream.status).json({
        error: data.error || data.message || "Gagal mengunduh video hasil."
      });
    }

    res.setHeader("Content-Type", upstream.headers.get("content-type") || "video/mp4");
    res.setHeader("Content-Disposition", 'attachment; filename="hasil-omni-flash.mp4"');

    const buffer = Buffer.from(await upstream.arrayBuffer());
    return res.send(buffer);
  } catch (error) {
    console.error("Download error:", error);
    return res.status(500).json({ error: error.message });
  }
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Omni Flash Web App berjalan di port ${PORT}`);
});

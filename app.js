const form = document.getElementById("generatorForm");
const imageInput = document.getElementById("imageInput");
const videoInput = document.getElementById("videoInput");
const promptInput = document.getElementById("promptInput");
const button = document.getElementById("generateButton");
const resultPanel = document.getElementById("resultPanel");
const progressWrap = document.getElementById("progressWrap");
const statusTitle = document.getElementById("statusTitle");
const statusText = document.getElementById("statusText");
const resultVideo = document.getElementById("resultVideo");
const downloadLink = document.getElementById("downloadLink");
const errorText = document.getElementById("errorText");
const resultBadge = document.getElementById("resultBadge");

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  document.getElementById("imageName").textContent = file ? file.name : "";
  const preview = document.getElementById("imagePreview");
  if (file) {
    preview.src = URL.createObjectURL(file);
    preview.hidden = false;
  } else preview.hidden = true;
});

videoInput.addEventListener("change", () => {
  const file = videoInput.files[0];
  document.getElementById("videoName").textContent = file ? file.name : "";
  const preview = document.getElementById("videoPreview");
  if (file) {
    preview.src = URL.createObjectURL(file);
    preview.hidden = false;
  } else preview.hidden = true;
});

promptInput.addEventListener("input", () => {
  document.getElementById("charCount").textContent = `${promptInput.value.length}/5000`;
});

function showError(message) {
  errorText.textContent = message;
  errorText.hidden = false;
  progressWrap.hidden = true;
  resultBadge.textContent = "Gagal";
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorText.hidden = true;
  resultVideo.hidden = true;
  downloadLink.hidden = true;
  resultPanel.hidden = false;
  progressWrap.hidden = false;
  button.disabled = true;
  button.textContent = "Mengirim...";
  statusTitle.textContent = "Mengirim permintaan...";
  statusText.textContent = "Mengunggah foto dan video ke Nexabot.";
  resultBadge.textContent = "Memproses";

  try {
    const body = new FormData();
    body.append("image", imageInput.files[0]);
    body.append("video", videoInput.files[0]);
    body.append("prompt", promptInput.value.trim());

    const submitResponse = await fetch("/api/generate", { method: "POST", body });
    const submitted = await submitResponse.json();
    if (!submitResponse.ok || !submitted.jobId) {
      throw new Error(submitted.error || "Gagal memulai proses generate.");
    }

    const jobId = submitted.jobId;
    statusTitle.textContent = "Video sedang dibuat...";
    statusText.textContent = `Job ID: ${jobId}. Halaman ini akan memeriksa status secara berkala.`;

    let completed = false;
    for (let i = 0; i < 90; i++) {
      await sleep(4000);
      const statusResponse = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`);
      const statusData = await statusResponse.json();

      if (!statusResponse.ok) {
        throw new Error(statusData.error || "Gagal memeriksa status proses.");
      }

      const status = String(statusData.status || "").toLowerCase();
      statusText.textContent = `Status: ${status || "processing"} · Job ID: ${jobId}`;

      if (status === "done" || status === "completed") {
        completed = true;
        break;
      }
      if (status === "failed" || status === "error") {
        throw new Error(statusData.error || "Proses generate gagal di Nexabot.");
      }
    }

    if (!completed) {
      throw new Error(`Waktu tunggu habis. Simpan Job ID ini untuk pengecekan: ${jobId}`);
    }

    statusTitle.textContent = "Menyiapkan video hasil...";
    statusText.textContent = "Mengunduh hasil dari Nexabot.";

    const downloadResponse = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/download`);
    if (!downloadResponse.ok) {
      let message = "Gagal mengunduh video hasil.";
      try { const data = await downloadResponse.json(); message = data.error || message; } catch {}
      throw new Error(message);
    }

    const blob = await downloadResponse.blob();
    const url = URL.createObjectURL(blob);
    resultVideo.src = url;
    resultVideo.hidden = false;
    downloadLink.href = url;
    downloadLink.hidden = false;
    progressWrap.hidden = true;
    resultBadge.textContent = "Selesai";
  } catch (error) {
    showError(error.message || "Terjadi kesalahan.");
  } finally {
    button.disabled = false;
    button.innerHTML = "<span>✦</span> Generate video";
  }
});

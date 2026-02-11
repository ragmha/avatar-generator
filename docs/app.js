// DOM elements
const dropZone = document.getElementById("dropZone");
const dropContent = document.getElementById("dropContent");
const fileInput = document.getElementById("fileInput");
const originalCanvas = document.getElementById("originalCanvas");
const avatarCanvas = document.getElementById("avatarCanvas");
const placeholder = document.getElementById("placeholder");
const arrow = document.getElementById("arrow");
const actions = document.getElementById("actions");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");
const pixelSizeInput = document.getElementById("pixelSize");
const pixelSizeLabel = document.getElementById("pixelSizeLabel");
const resultLabel = document.getElementById("resultLabel");
const soundToggle = document.getElementById("soundToggle");
const soundIcon = document.getElementById("soundIcon");
const styleBtns = document.querySelectorAll(".style-btn");

let loadedImage = null;
let currentStyle = "8bit";

// Style selector
styleBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    styleBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentStyle = btn.dataset.style;
    const info = PALETTES[currentStyle];
    resultLabel.textContent = `${info.name} Avatar`;
    RetroSound.styleSwitch();
    if (loadedImage) generateAvatar();
  });
});

// Sound toggle
soundIcon.addEventListener("click", () => {
  soundToggle.checked = !soundToggle.checked;
  RetroSound.enabled = soundToggle.checked;
  soundIcon.textContent = soundToggle.checked ? "🔊" : "🔇";
  if (soundToggle.checked) RetroSound.click();
});

// Pixel size slider
pixelSizeInput.addEventListener("input", () => {
  const val = pixelSizeInput.value;
  pixelSizeLabel.textContent = `${val}×${val}`;
  if (loadedImage) generateAvatar();
});

// Drop zone click
dropZone.addEventListener("click", () => fileInput.click());

// Drag events
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) handleFile(file);
});

// File input
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

function handleFile(file) {
  RetroSound.generate();
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      loadedImage = img;
      showOriginal(img);
      generateAvatar();
      RetroSound.complete();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function showOriginal(img) {
  const size = Math.min(img.width, img.height);
  const sx = (img.width - size) / 2;
  const sy = (img.height - size) / 2;

  originalCanvas.width = 512;
  originalCanvas.height = 512;
  const ctx = originalCanvas.getContext("2d");
  ctx.drawImage(img, sx, sy, size, size, 0, 0, 512, 512);

  originalCanvas.hidden = false;
  dropContent.hidden = true;
}

function generateAvatar() {
  if (!loadedImage) return;

  const pixelSize = parseInt(pixelSizeInput.value);
  const img = loadedImage;
  const style = currentStyle;
  const palette = PALETTES[style].colors;

  // Crop to square center
  const size = Math.min(img.width, img.height);
  const sx = (img.width - size) / 2;
  const sy = (img.height - size) / 2;

  // Step 1: Downscale to pixel grid
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = pixelSize;
  tempCanvas.height = pixelSize;
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.imageSmoothingEnabled = true;
  tempCtx.drawImage(img, sx, sy, size, size, 0, 0, pixelSize, pixelSize);

  // Step 2: Quantize colors to selected palette
  const imageData = tempCtx.getImageData(0, 0, pixelSize, pixelSize);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = quantizePixel(data[i], data[i + 1], data[i + 2], style, palette);
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  tempCtx.putImageData(imageData, 0, 0);

  // Step 3: Draw result — notion uses smooth upscale, others use pixelated
  const isSmooth = PALETTES[style].smooth;
  const outSize = isSmooth ? 512 : pixelSize;
  avatarCanvas.width = outSize;
  avatarCanvas.height = outSize;
  const avatarCtx = avatarCanvas.getContext("2d");

  if (isSmooth) {
    // Smooth bilinear upscale for illustration look
    avatarCtx.imageSmoothingEnabled = true;
    avatarCtx.imageSmoothingQuality = "high";
    avatarCtx.drawImage(tempCanvas, 0, 0, outSize, outSize);
  } else {
    avatarCtx.drawImage(tempCanvas, 0, 0);
  }

  // Toggle CSS rendering mode
  avatarCanvas.style.imageRendering = isSmooth ? "auto" : "pixelated";

  // Show UI
  placeholder.hidden = true;
  arrow.hidden = false;
  actions.hidden = false;
}

// Download
downloadBtn.addEventListener("click", () => {
  RetroSound.download();
  const exportSize = 512;
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = exportSize;
  exportCanvas.height = exportSize;
  const ctx = exportCanvas.getContext("2d");
  const isSmooth = PALETTES[currentStyle].smooth;
  ctx.imageSmoothingEnabled = isSmooth || false;
  if (isSmooth) ctx.imageSmoothingQuality = "high";
  ctx.drawImage(avatarCanvas, 0, 0, exportSize, exportSize);

  const info = PALETTES[currentStyle];
  const link = document.createElement("a");
  link.download = `avatar_${currentStyle}.png`;
  link.href = exportCanvas.toDataURL("image/png");
  link.click();
});

// Reset
resetBtn.addEventListener("click", () => {
  RetroSound.click();
  loadedImage = null;
  originalCanvas.hidden = true;
  dropContent.hidden = false;
  placeholder.hidden = false;
  arrow.hidden = true;
  actions.hidden = true;
  avatarCanvas.width = 0;
  avatarCanvas.height = 0;
  fileInput.value = "";
});

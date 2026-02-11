// 8-Bit Color Palette (64 colors: 4 levels per channel)
const LEVELS = [0, 85, 170, 255];
const PALETTE = [];
for (const r of LEVELS)
  for (const g of LEVELS)
    for (const b of LEVELS) PALETTE.push([r, g, b]);

function nearestColor(r, g, b) {
  let minDist = Infinity;
  let best = [0, 0, 0];
  for (const [pr, pg, pb] of PALETTE) {
    const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
    if (dist < minDist) {
      minDist = dist;
      best = [pr, pg, pb];
    }
  }
  return best;
}

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

let loadedImage = null;

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
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      loadedImage = img;
      showOriginal(img);
      generateAvatar();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function showOriginal(img) {
  // Show original on canvas
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

  // Step 2: Quantize colors to 8-bit palette
  const imageData = tempCtx.getImageData(0, 0, pixelSize, pixelSize);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = nearestColor(data[i], data[i + 1], data[i + 2]);
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    // alpha stays 255
  }

  tempCtx.putImageData(imageData, 0, 0);

  // Step 3: Draw pixelated result (CSS handles crisp scaling)
  avatarCanvas.width = pixelSize;
  avatarCanvas.height = pixelSize;
  const avatarCtx = avatarCanvas.getContext("2d");
  avatarCtx.drawImage(tempCanvas, 0, 0);

  // Show UI
  placeholder.hidden = true;
  arrow.hidden = false;
  actions.hidden = false;
}

// Download
downloadBtn.addEventListener("click", () => {
  // Upscale for download
  const exportSize = 512;
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = exportSize;
  exportCanvas.height = exportSize;
  const ctx = exportCanvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(avatarCanvas, 0, 0, exportSize, exportSize);

  const link = document.createElement("a");
  link.download = "avatar_8bit.png";
  link.href = exportCanvas.toDataURL("image/png");
  link.click();
});

// Reset
resetBtn.addEventListener("click", () => {
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

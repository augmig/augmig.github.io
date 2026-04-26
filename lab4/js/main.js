'use strict';

const video = document.querySelector('#video');
const outputCanvas = document.querySelector('#output');
const outputCtx = outputCanvas.getContext('2d', { willReadFrequently: true });

const snapshotCanvas = document.querySelector('#snapshotCanvas');
const snapshotCtx = snapshotCanvas.getContext('2d');

const filterSelect = document.querySelector('#filter');
const thresholdSlider = document.querySelector('#threshold');
const gainSlider = document.querySelector('#gain');
const thresholdValue = document.querySelector('#thresholdValue');
const gainValue = document.querySelector('#gainValue');

const startButton = document.querySelector('#startCamera');
const stopButton = document.querySelector('#stopCamera');
const snapshotButton = document.querySelector('#snapshot');

const downloadSnapshot = document.querySelector('#downloadSnapshot');
const secureStatus = document.querySelector('#secureStatus');
const cameraStatus = document.querySelector('#cameraStatus');
const errorBox = document.querySelector('#errorBox');

let stream = null;
let animationFrameId = null;

const processCanvas = document.createElement('canvas');
const processCtx = processCanvas.getContext('2d', { willReadFrequently: true });

let luminanceBuffer = new Uint8ClampedArray(0);
let edgeImageData = null;

const SOBEL_WIDTH = 320;

const cssFilters = {
  none: 'none',
  blur: 'blur(6px)',
  grayscale: 'grayscale(100%)',
  invert: 'invert(100%)',
  sepia: 'sepia(100%)',
};

function isSecureRuntime() {
  return window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
}

function updateSecureStatus() {
  if (isSecureRuntime()) {
    secureStatus.textContent = 'Secure context OK';
    secureStatus.className = 'badge';
  } else {
    secureStatus.textContent = 'HTTPS required for camera';
    secureStatus.className = 'badge danger';
  }
}

function updateControlLabels() {
  thresholdValue.textContent = thresholdSlider.value;
  gainValue.textContent = Number(gainSlider.value).toFixed(1);
}

function updateFilterControlState() {
  const sobelSelected = filterSelect.value === 'sobel';

  thresholdSlider.disabled = !sobelSelected;
  gainSlider.disabled = !sobelSelected;

  thresholdSlider.closest('.control').style.opacity = sobelSelected ? '1' : '0.45';
  gainSlider.closest('.control').style.opacity = sobelSelected ? '1' : '0.45';
}

function setCameraStatus(text, variant = 'muted') {
  cameraStatus.textContent = text;
  cameraStatus.className = variant === 'danger' ? 'badge danger' : variant === 'ok' ? 'badge' : 'badge muted';
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function clearError() {
  errorBox.textContent = '';
  errorBox.hidden = true;
}

async function startCamera() {
  clearError();

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showError('This browser does not support navigator.mediaDevices.getUserMedia. Try Chrome, Edge, or Firefox.');
    setCameraStatus('Camera API unavailable', 'danger');
    return;
  }

  try {
    stopCamera(false);

    setCameraStatus('Requesting camera...');

    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user',
      },
    });

    video.srcObject = stream;
    await video.play();

    setCameraStatus('Camera running', 'ok');

    startButton.disabled = true;
    stopButton.disabled = false;
    snapshotButton.disabled = false;

    renderFrame();
  } catch (error) {
    const hint = isSecureRuntime()
      ? 'Allow camera permission and make sure no other application is using the camera.'
      : 'Open this app through HTTPS, not file:// or plain HTTP.';

    showError(`Camera error: ${error.name}. ${hint}`);
    setCameraStatus('Camera error', 'danger');

    startButton.disabled = false;
    stopButton.disabled = true;
    snapshotButton.disabled = true;
  }
}

function stopCamera(clear = true) {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  video.srcObject = null;

  if (clear) {
    outputCtx.filter = 'none';
    outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    setCameraStatus('Camera stopped');
  }

  startButton.disabled = false;
  stopButton.disabled = true;
  snapshotButton.disabled = true;
}

function resizeCanvas(width, height) {
  if (outputCanvas.width !== width || outputCanvas.height !== height) {
    outputCanvas.width = width;
    outputCanvas.height = height;
  }
}

function resizeCanvasToVideo() {
  const width = video.videoWidth || 640;
  const height = video.videoHeight || 480;
  resizeCanvas(width, height);
}

function renderFrame() {
  if (!stream || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    animationFrameId = requestAnimationFrame(renderFrame);
    return;
  }

  if (filterSelect.value === 'sobel') {
    drawSobelEdge();
  } else {
    drawCssFilter(filterSelect.value);
  }

  animationFrameId = requestAnimationFrame(renderFrame);
}

function drawCssFilter(filterName) {
  resizeCanvasToVideo();

  outputCtx.filter = cssFilters[filterName] || 'none';
  outputCtx.drawImage(video, 0, 0, outputCanvas.width, outputCanvas.height);
  outputCtx.filter = 'none';
}

function prepareSobelCanvas() {
  const videoWidth = video.videoWidth || 640;
  const videoHeight = video.videoHeight || 480;

  const width = SOBEL_WIDTH;
  const height = Math.round((videoHeight / videoWidth) * width);

  resizeCanvas(width, height);

  if (processCanvas.width !== width || processCanvas.height !== height) {
    processCanvas.width = width;
    processCanvas.height = height;
    luminanceBuffer = new Uint8ClampedArray(width * height);
    edgeImageData = outputCtx.createImageData(width, height);
  }

  return { width, height };
}

function drawSobelEdge() {
  const { width, height } = prepareSobelCanvas();

  const threshold = Number(thresholdSlider.value);
  const gain = Number(gainSlider.value);

  processCtx.drawImage(video, 0, 0, width, height);

  const source = processCtx.getImageData(0, 0, width, height);
  const src = source.data;
  const out = edgeImageData.data;

  for (let i = 0, j = 0; i < src.length; i += 4, j += 1) {
    luminanceBuffer[j] = (src[i] * 77 + src[i + 1] * 150 + src[i + 2] * 29) >> 8;
  }

  for (let i = 0; i < out.length; i += 4) {
    out[i] = 0;
    out[i + 1] = 0;
    out[i + 2] = 0;
    out[i + 3] = 255;
  }

  for (let y = 1; y < height - 1; y += 1) {
    const row = y * width;

    for (let x = 1; x < width - 1; x += 1) {
      const index = row + x;

      const topLeft = luminanceBuffer[index - width - 1];
      const top = luminanceBuffer[index - width];
      const topRight = luminanceBuffer[index - width + 1];

      const left = luminanceBuffer[index - 1];
      const right = luminanceBuffer[index + 1];

      const bottomLeft = luminanceBuffer[index + width - 1];
      const bottom = luminanceBuffer[index + width];
      const bottomRight = luminanceBuffer[index + width + 1];

      const gx = -topLeft + topRight - 2 * left + 2 * right - bottomLeft + bottomRight;
      const gy = -topLeft - 2 * top - topRight + bottomLeft + 2 * bottom + bottomRight;

      const magnitude = Math.min(255, ((Math.abs(gx) + Math.abs(gy)) * gain) / 4);
      const edge = magnitude >= threshold ? 255 : 0;

      const outputIndex = index * 4;

      out[outputIndex] = edge;
      out[outputIndex + 1] = edge;
      out[outputIndex + 2] = edge;
      out[outputIndex + 3] = 255;
    }
  }

  outputCtx.putImageData(edgeImageData, 0, 0);
}

function takeSnapshot() {
  if (!stream) {
    showError('Start the camera before taking a snapshot.');
    return;
  }

  const width = snapshotCanvas.width;
  const height = snapshotCanvas.height;

  snapshotCtx.clearRect(0, 0, width, height);
  snapshotCtx.drawImage(outputCanvas, 0, 0, width, height);

  downloadSnapshot.href = snapshotCanvas.toDataURL('image/png');
  downloadSnapshot.hidden = false;
}

filterSelect.addEventListener('change', () => {
  clearError();
  updateFilterControlState();
});

thresholdSlider.addEventListener('input', updateControlLabels);
gainSlider.addEventListener('input', updateControlLabels);

startButton.addEventListener('click', startCamera);
stopButton.addEventListener('click', () => stopCamera(true));
snapshotButton.addEventListener('click', takeSnapshot);

updateSecureStatus();
updateControlLabels();
updateFilterControlState();

stopButton.disabled = true;
snapshotButton.disabled = true;

startCamera();
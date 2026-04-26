const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

const localVideo = document.getElementById('localVideo');
const videoPlaceholder = document.getElementById('videoPlaceholder');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const copyOfferButton = document.getElementById('copyOfferButton');
const connectButton = document.getElementById('connectButton');
const offerBox = document.getElementById('offerBox');
const answerBox = document.getElementById('answerBox');
const statusText = document.getElementById('statusText');

let peerConnection = null;
let localStream = null;

function setStatus(message) {
  statusText.textContent = message;
}

function setPlaceholderVisible(isVisible) {
  videoPlaceholder.classList.toggle('hidden', !isVisible);
}

function waitForIceGatheringComplete(pc) {
  if (pc.iceGatheringState === 'complete') {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    function checkState() {
      if (pc.iceGatheringState === 'complete') {
        pc.removeEventListener('icegatheringstatechange', checkState);
        resolve();
      }
    }

    pc.addEventListener('icegatheringstatechange', checkState);
  });
}

async function copyTextFrom(textarea, button, originalLabel) {
  if (!textarea.value.trim()) {
    return;
  }

  await navigator.clipboard.writeText(textarea.value);
  button.textContent = 'Copied';
  setTimeout(() => {
    button.textContent = originalLabel;
  }, 1200);
}

async function startCameraAndCreateOffer() {
  try {
    startButton.disabled = true;
    setStatus('Requesting camera access');

    localStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: true
    });

    localVideo.srcObject = localStream;
    setPlaceholderVisible(false);

    peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onconnectionstatechange = () => {
      setStatus(`Connection: ${peerConnection.connectionState}`);
    };

    peerConnection.oniceconnectionstatechange = () => {
      if (peerConnection.iceConnectionState === 'failed') {
        setStatus('ICE failed. Try refreshing both pages and repeat SDP exchange.');
      }
    };

    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    setStatus('Creating offer');
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    setStatus('Collecting ICE candidates');
    await waitForIceGatheringComplete(peerConnection);

    offerBox.value = JSON.stringify(peerConnection.localDescription);
    copyOfferButton.disabled = false;
    connectButton.disabled = false;
    stopButton.disabled = false;
    setStatus('Offer ready. Copy it to the client page.');
  } catch (error) {
    console.error(error);
    startButton.disabled = false;
    setStatus(error.message || 'Could not start camera');
  }
}

async function connectAnswer() {
  if (!peerConnection) {
    setStatus('Start camera and create an offer first.');
    return;
  }

  try {
    const answerText = answerBox.value.trim();
    if (!answerText) {
      setStatus('Paste the client answer SDP first.');
      return;
    }

    const answerDescription = new RTCSessionDescription(JSON.parse(answerText));
    await peerConnection.setRemoteDescription(answerDescription);
    setStatus('Answer connected. Waiting for peer connection.');
    connectButton.disabled = true;
  } catch (error) {
    console.error(error);
    setStatus('Invalid answer SDP. Check that the copied text is complete JSON.');
  }
}

function stopCamera() {
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }

  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  localVideo.srcObject = null;
  offerBox.value = '';
  answerBox.value = '';
  startButton.disabled = false;
  stopButton.disabled = true;
  copyOfferButton.disabled = true;
  connectButton.disabled = true;
  setPlaceholderVisible(true);
  setStatus('Stopped');
}

if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  startButton.disabled = true;
  setStatus('getUserMedia is not supported in this browser.');
}

startButton.addEventListener('click', startCameraAndCreateOffer);
stopButton.addEventListener('click', stopCamera);
connectButton.addEventListener('click', connectAnswer);
copyOfferButton.addEventListener('click', () => copyTextFrom(offerBox, copyOfferButton, 'Copy offer'));

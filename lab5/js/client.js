const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

const remoteVideo = document.getElementById('remoteVideo');
const videoPlaceholder = document.getElementById('videoPlaceholder');
const createAnswerButton = document.getElementById('createAnswerButton');
const copyAnswerButton = document.getElementById('copyAnswerButton');
const offerBox = document.getElementById('offerBox');
const answerBox = document.getElementById('answerBox');
const statusText = document.getElementById('statusText');

let peerConnection = null;
let remoteStream = null;

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

async function copyAnswer() {
  if (!answerBox.value.trim()) {
    return;
  }

  await navigator.clipboard.writeText(answerBox.value);
  copyAnswerButton.textContent = 'Copied';
  setTimeout(() => {
    copyAnswerButton.textContent = 'Copy answer';
  }, 1200);
}

async function createAnswer() {
  try {
    const offerText = offerBox.value.trim();
    if (!offerText) {
      setStatus('Paste the server offer SDP first.');
      return;
    }

    createAnswerButton.disabled = true;
    answerBox.value = '';
    setStatus('Reading server offer');

    peerConnection = new RTCPeerConnection(configuration);
    remoteStream = new MediaStream();
    remoteVideo.srcObject = remoteStream;

    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
      setPlaceholderVisible(false);
      setStatus('Remote stream received');
    };

    peerConnection.onconnectionstatechange = () => {
      setStatus(`Connection: ${peerConnection.connectionState}`);
    };

    peerConnection.oniceconnectionstatechange = () => {
      if (peerConnection.iceConnectionState === 'failed') {
        setStatus('ICE failed. Refresh both pages and repeat SDP exchange.');
      }
    };

    const offerDescription = new RTCSessionDescription(JSON.parse(offerText));
    await peerConnection.setRemoteDescription(offerDescription);

    setStatus('Creating answer');
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    setStatus('Collecting ICE candidates');
    await waitForIceGatheringComplete(peerConnection);

    answerBox.value = JSON.stringify(peerConnection.localDescription);
    copyAnswerButton.disabled = false;
    setStatus('Answer ready. Copy it back to the server page.');
  } catch (error) {
    console.error(error);
    createAnswerButton.disabled = false;
    setStatus('Invalid offer SDP or WebRTC error. Check that the copied text is complete JSON.');
  }
}

createAnswerButton.addEventListener('click', createAnswer);
copyAnswerButton.addEventListener('click', copyAnswer);

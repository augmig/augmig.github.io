(function () {
  'use strict';

  const DEFAULT_STREAM = 'https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8';
  const HLS_MIME_TYPES = ['application/vnd.apple.mpegurl', 'application/x-mpegURL'];

  let video;
  let hls;
  let statusElement;

  document.addEventListener('DOMContentLoaded', initPlayer);

  function initPlayer() {
    video = document.getElementById('hlsPlayer');
    statusElement = document.getElementById('status');

    if (!video) {
      return;
    }

    bindButtonEvents();
    bindVideoEvents();
    loadStream(DEFAULT_STREAM, false);
  }

  function bindButtonEvents() {
    bindClick('playBtn', playVideo);
    bindClick('pauseBtn', pauseVideo);
    bindClick('stopBtn', stopVideo);
    bindClick('forwardBtn', function () { jump(5); });
    bindClick('backwardBtn', function () { jump(-5); });
    bindClick('shuffleBtn', shufflePlaylist);

    document.querySelectorAll('.loadBtn').forEach(function (button) {
      button.addEventListener('click', function () {
        const inputId = button.getAttribute('data-input');
        const input = document.getElementById(inputId);
        loadStream(input ? input.value : DEFAULT_STREAM, true);
      });
    });
  }

  function bindClick(elementId, handler) {
    const element = document.getElementById(elementId);

    if (element) {
      element.addEventListener('click', handler);
    }
  }

  function bindVideoEvents() {
    video.addEventListener('loadedmetadata', function () {
      setStatus('Stream loaded. Press Play to start playback.');
    });

    video.addEventListener('play', function () {
      setStatus('Playback started.');
    });

    video.addEventListener('pause', function () {
      if (video.currentTime > 0 && !video.ended) {
        setStatus('Playback paused.');
      }
    });

    video.addEventListener('ended', function () {
      setStatus('Playback ended.');
    });

    video.addEventListener('error', function () {
      setStatus('Video error. Check the stream URL or run the page through a local web server.');
    });
  }

  function setStatus(message) {
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  function loadStream(url, autoplay) {
    const streamUrl = (url || DEFAULT_STREAM).trim();

    if (!streamUrl) {
      setStatus('Please enter a valid HLS URL.');
      return;
    }

    resetCurrentStream();
    setStatus('Loading stream...');

    if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls();
      hls.attachMedia(video);

      hls.on(window.Hls.Events.MEDIA_ATTACHED, function () {
        hls.loadSource(streamUrl);
      });

      hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
        setStatus('Stream loaded. Press Play to start playback.');

        if (autoplay) {
          playVideo();
        }
      });

      hls.on(window.Hls.Events.ERROR, function (_event, data) {
        if (data && data.fatal) {
          setStatus('Fatal HLS error. Check the stream URL or internet connection.');
          resetHls();
        }
      });

      return;
    }

    if (browserCanPlayNativeHls()) {
      video.src = streamUrl;
      video.load();

      if (autoplay) {
        playVideo();
      }

      return;
    }

    setStatus('HLS playback is not supported in this browser. Use Chrome, Edge, Firefox, or Safari with internet access.');
  }

  function resetCurrentStream() {
    pauseVideo(false);
    resetHls();
    video.removeAttribute('src');
    video.load();
  }

  function resetHls() {
    if (hls) {
      hls.destroy();
      hls = null;
    }
  }

  function browserCanPlayNativeHls() {
    return HLS_MIME_TYPES.some(function (type) {
      return video.canPlayType(type) !== '';
    });
  }

  function playVideo() {
    const playPromise = video.play();

    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {
        setStatus('Playback is ready. Press Play again if the browser blocked autoplay.');
      });
    }
  }

  function pauseVideo(updateStatus) {
    video.pause();

    if (updateStatus !== false) {
      setStatus('Playback paused.');
    }
  }

  function stopVideo() {
    video.pause();

    try {
      video.currentTime = 0;
    } catch (_error) {
      setStatus('Playback stopped. The current stream cannot seek to 0 seconds yet.');
      return;
    }

    setStatus('Playback stopped and returned to the beginning.');
  }

  function jump(seconds) {
    const currentTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    const duration = video.duration;
    let targetTime = currentTime + seconds;

    if (Number.isFinite(duration)) {
      targetTime = Math.min(Math.max(targetTime, 0), duration);
    } else {
      targetTime = Math.max(targetTime, 0);
    }

    try {
      video.currentTime = targetTime;
      setStatus('Jumped to ' + targetTime.toFixed(1) + ' seconds.');
    } catch (_error) {
      setStatus('This stream is not seekable yet. Start playback first, then try jumping.');
    }
  }

  function shufflePlaylist() {
    const playlistInputs = Array.from(document.querySelectorAll('.playlist input'));
    const urls = playlistInputs.map(function (input) {
      return input.value.trim();
    }).filter(Boolean);

    if (urls.length === 0) {
      setStatus('Playlist is empty.');
      return;
    }

    const randomIndex = Math.floor(Math.random() * urls.length);
    setStatus('Shuffle selected item ' + (randomIndex + 1) + '.');
    loadStream(urls[randomIndex], true);
  }
}());

# mediaLab4

WebRTC realtime camera filtering laboratory work.

## Option

Option A is implemented.

## Implemented requirements

- Camera stream with `navigator.mediaDevices.getUserMedia`.
- Filters:
  - None
  - Blur
  - Grayscale
  - Invert
  - Sepia
  - Sobel Edge
- Realtime controls:
  - edge threshold;
  - edge gain;
  - start camera;
  - stop camera;
  - take snapshot;
  - download snapshot.

## Run

Generate a certificate:

```bash
./generate_cert.sh
```

Start the HTTPS server:

```bash
node server.js
```

Open:

```text
https://localhost:8443/
```

## Browser testing

| Browser | Version | Result |
| --- | --- | --- |
| Google Chrome |  | Works |
| Mozilla Firefox / Microsoft Edge |  | Works |

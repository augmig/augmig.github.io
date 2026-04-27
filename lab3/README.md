# Lab 3 — AR UGS Station (Hiro marker)

This lab is the first Augmented Reality application for mediaLab3.

It uses **AR.js + A-Frame + Three.js** with the standard **Hiro marker**.
When the marker is detected, a complex 3D UGS station appears above it.

## 1) Generate HTTPS certificate

From the `lab3` folder:

```bash
./generate_cert.sh
```

This script is compatible with Windows Git Bash because it uses an OpenSSL config file (avoids MSYS path conversion issues with `-subj`).

## 2) Start HTTPS server

From the same folder:

```bash
python serve_https.py
```

Server URL:

- `https://localhost:8443/`

## 3) Open the AR page

Open in your browser:

- `https://localhost:8443/index.html`

Allow camera access when prompted.

## 4) Open Hiro marker

Open marker page in another browser tab/window or on a second device:

- `https://localhost:8443/marker.html`

You can also print it from that page.

## 5) Expected behavior

- Camera view fills the page.
- AR control panel is visible on top.
- Status shows `Marker not detected` when marker is out of view.
- Status changes to `Hiro marker detected` when marker is visible.
- Complex 3D model appears clearly above the Hiro marker.
- Controls work:
  - Pause animation / Start animation
  - Scale +
  - Scale -
  - Change color
  - Reset

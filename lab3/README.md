# mediaLab3

Augmented Reality laboratory work.

## Option

Option A is implemented: a custom Three.js model is displayed on the Hiro marker.

The model is built from Three.js primitives and includes a base platform, legs, electronics body, sensor window, solar panels, mast, radar, antenna and beacon.

## Controls

- **Pause animation / Start animation** - toggles animation.
- **Scale +** - increases model size.
- **Scale -** - decreases model size.
- **Change color** - changes the model accent color.
- **Reset** - restores default values.

## Run

Generate a certificate:

```bash
./generate_cert.sh
```

Start the HTTPS server:

```bash
python serve_https.py
```

Open:

```text
https://localhost:8443/
```

The Hiro marker image is in `src/data/hiro-marker.jpg` and can also be opened from the marker page.

## Browser testing

| Browser | Version | Result |
| --- | --- | --- |
| Google Chrome |  | Works |
| Mozilla Firefox / Microsoft Edge |  | Works |

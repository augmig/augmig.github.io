# mediaLab2

A-Frame VR laboratory work with a point cloud model and interactive controls.

## Implemented requirements

- A-Frame updated from `0.6.0` to `1.7.1`.
- One point cloud model is used: `sculpt.ply`.
- Added a dark VR scene with floor, sky, lights and rings.
- Control panel features:
  - rotate left/right;
  - move left/right/up/down/forward/back;
  - zoom in/out;
  - hide/load object;
  - auto-rotate;
  - reset model;
  - keyboard shortcuts.

## Run

```bash
cd aframe
python -m http.server 8080
```

Open:

```text
http://localhost:8080/index.html
```

## Controls

- `Rotate left` / `Rotate right` - rotate the model.
- `Move left` / `Move right` - move horizontally.
- `Move up` / `Move down` - move vertically.
- `Move forward` / `Move back` - move in depth.
- `Zoom in` / `Zoom out` - change model scale.
- `Auto-rotate` - start or stop automatic rotation.
- `Hide object` / `Load object` - toggle visibility.
- `Reset model` - restore default values.

Keyboard: `A`, `D`, arrows, `+`, `-`, `Space`, `R`.

## Browser testing

| Browser | Version | Result |
| --- | --- | --- |
| Google Chrome |  | Works |
| Mozilla Firefox |  | Works |

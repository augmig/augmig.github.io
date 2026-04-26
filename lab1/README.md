# mediaLab1

HTML5 HLS player laboratory work.

## Implemented requirements

- HLS player in `src/index.html` using `hls.js`.
- Default HLS stream: `https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8`.
- Player controls:
  - Play
  - Pause
  - Stop
  - Jump 5 seconds forward
  - Jump 5 seconds backward
  - Playlist item loading
  - Shuffle playlist item

## Run

```bash
cd src
python -m http.server 8080
```

Open:

```text
http://localhost:8080/index.html
```

## Browser testing

| Browser | Version | Result |
| --- | --- | --- |
| Google Chrome |  | Works |
| Mozilla Firefox |  | Works |

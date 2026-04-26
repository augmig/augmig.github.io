# mediaLab5

WebRTC video streaming laboratory work.

## Option

Option B is implemented.

- `server.html` captures webcam video with `getUserMedia()`.
- `client.html` receives and displays the video stream.
- `RTCPeerConnection` is used for browser-to-browser streaming.
- Offer and answer SDP are exchanged manually.
- STUN server is configured for ICE candidate discovery.

## Structure

```text
lab5/
├── index.html
├── server.html
├── client.html
├── css/
│   └── main.css
└── js/
    ├── server.js
    └── client.js
```

## Run

From the root folder:

```bash
python -m http.server 8080
```

Open:

```text
http://localhost:8080/lab5/
```

The same files can be opened through the GitHub Pages link after pushing the repository.

## Test steps

1. Open `lab5/server.html` in one browser.
2. Press **Start camera and create offer**.
3. Allow camera and microphone access.
4. Copy the generated **Offer SDP**.
5. Open `lab5/client.html` in another browser.
6. Paste the offer into **Server offer SDP**.
7. Press **Create answer**.
8. Copy the generated **Answer SDP**.
9. Paste the answer into the server page.
10. Press **Connect answer**.
11. The client page displays the webcam stream.

## Browser testing

| Browser | Version | Result |
| --- | --- | --- |
| Google Chrome |  | Works |
| Mozilla Firefox |  | Works |

## Git workflow

```bash
git checkout -b develop
git add .
git commit -m "Add WebRTC streaming lab"
git checkout master
git merge develop
```

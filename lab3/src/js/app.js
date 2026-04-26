/* global THREE, THREEx */

var scene;
var camera;
var renderer;
var clock;
var arToolkitSource;
var arToolkitContext;
var markerRoot;
var stationRoot;
var radarHead;
var beacon;
var solarPanels = [];
var accentMaterials = [];
var animationEnabled = true;
var modelScale = 1;
var colorIndex = 0;

var accentColors = [
    0x38bdf8,
    0x22c55e,
    0xf97316,
    0xa78bfa,
    0xef4444
];

initialize();
animate();

function initialize() {
    scene = new THREE.Scene();

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.75);
    directionalLight.position.set(1.6, 2.2, 1.4);
    scene.add(directionalLight);

    camera = new THREE.Camera();
    scene.add(camera);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setClearColor(new THREE.Color("lightgrey"), 0);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(640, 480);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0px";
    renderer.domElement.style.left = "0px";
    renderer.domElement.style.zIndex = "1";
    renderer.domElement.style.pointerEvents = "none";
    document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    arToolkitSource = new THREEx.ArToolkitSource({
        sourceType: "webcam"
    });

    arToolkitSource.init(function onReady() {
        if (arToolkitSource.domElement) {
            arToolkitSource.domElement.style.zIndex = "0";
            arToolkitSource.domElement.style.objectFit = "cover";
            arToolkitSource.domElement.style.background = "#000";

            if (arToolkitSource.domElement.play) {
                var playResult = arToolkitSource.domElement.play();

                if (playResult && playResult.catch) {
                    playResult.catch(function () {
                        setStatus("Camera is ready. Click the page once if the video does not start automatically.");
                    });
                }
            }
        }

        onResize();
        setStatus("Camera is active. Show the Hiro marker to display the 3D station.");
    }, function onError(error) {
        var message = error && error.message ? error.message : "Unknown camera error";
        setStatus("Camera error: " + message + ". Check browser camera permission and refresh the page.");
    });

    window.addEventListener("resize", onResize);

    arToolkitContext = new THREEx.ArToolkitContext({
        cameraParametersUrl: "data/camera_para.dat",
        detectionMode: "mono"
    });

    arToolkitContext.init(function onCompleted() {
        camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
    });

    markerRoot = new THREE.Group();
    scene.add(markerRoot);

    new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
        type: "pattern",
        patternUrl: "data/hiro.patt"
    });

    stationRoot = buildUgsStationModel();
    stationRoot.position.y = 0.02;
    markerRoot.add(stationRoot);

    bindUiControls();
    showProtocolWarningWhenNeeded();
}

function onResize() {
    arToolkitSource.onResize();
    arToolkitSource.copySizeTo(renderer.domElement);

    if (arToolkitContext && arToolkitContext.arController !== null) {
        arToolkitSource.copySizeTo(arToolkitContext.arController.canvas);
    }
}

function buildUgsStationModel() {
    var group = new THREE.Group();

    var darkMaterial = new THREE.MeshLambertMaterial({ color: 0x1f2937 });
    var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4b5563 });
    var panelMaterial = new THREE.MeshLambertMaterial({ color: 0x0f172a });
    var glassMaterial = new THREE.MeshLambertMaterial({
        color: 0x67e8f9,
        transparent: true,
        opacity: 0.72
    });
    var accentMaterial = new THREE.MeshLambertMaterial({ color: accentColors[colorIndex] });
    accentMaterials.push(accentMaterial);
    var warningMaterial = new THREE.MeshLambertMaterial({ color: 0xfacc15 });

    addBox(group, 1.45, 0.08, 1.45, 0, 0.04, 0, bodyMaterial);
    addBox(group, 1.08, 0.06, 1.08, 0, 0.12, 0, darkMaterial);

    addLeg(group, -0.58, 0.18, -0.58, darkMaterial, warningMaterial);
    addLeg(group, 0.58, 0.18, -0.58, darkMaterial, warningMaterial);
    addLeg(group, -0.58, 0.18, 0.58, darkMaterial, warningMaterial);
    addLeg(group, 0.58, 0.18, 0.58, darkMaterial, warningMaterial);

    addBox(group, 0.72, 0.42, 0.58, 0, 0.43, 0, bodyMaterial);
    addBox(group, 0.56, 0.05, 0.64, 0, 0.68, 0, darkMaterial);

    addBox(group, 0.34, 0.15, 0.03, 0, 0.47, 0.305, glassMaterial);
    addBox(group, 0.03, 0.18, 0.32, -0.375, 0.46, 0, darkMaterial);
    addBox(group, 0.03, 0.18, 0.32, 0.375, 0.46, 0, darkMaterial);

    var leftPanel = addBox(group, 0.62, 0.035, 0.36, -0.73, 0.72, 0, panelMaterial);
    leftPanel.rotation.z = -0.25;
    var rightPanel = addBox(group, 0.62, 0.035, 0.36, 0.73, 0.72, 0, panelMaterial);
    rightPanel.rotation.z = 0.25;
    solarPanels.push(leftPanel, rightPanel);

    addPanelGrid(group, -0.73, 0.742, 0, -0.25, accentMaterial);
    addPanelGrid(group, 0.73, 0.742, 0, 0.25, accentMaterial);

    addCylinder(group, 0.045, 0.045, 0.8, 0, 1.02, 0, darkMaterial, 16);
    addCylinder(group, 0.11, 0.11, 0.08, 0, 1.45, 0, bodyMaterial, 24);

    radarHead = new THREE.Group();
    radarHead.position.set(0, 1.52, 0);
    group.add(radarHead);

    addCylinder(radarHead, 0.08, 0.08, 0.28, 0, 0, 0, accentMaterial, 24).rotation.z = Math.PI / 2;
    var dish = addCylinder(radarHead, 0.04, 0.28, 0.18, 0, 0.02, 0.26, glassMaterial, 32);
    dish.rotation.x = Math.PI / 2;
    var dishRing = addTorus(radarHead, 0.285, 0.012, 0, 0.02, 0.35, accentMaterial);
    dishRing.rotation.x = Math.PI / 2;

    var antenna = addCylinder(radarHead, 0.015, 0.015, 0.55, 0, 0.35, -0.06, accentMaterial, 12);
    antenna.rotation.z = -0.3;
    addSphere(radarHead, 0.055, -0.08, 0.62, -0.12, warningMaterial, 16);

    addCylinder(group, 0.055, 0.055, 0.15, 0, 1.76, -0.34, darkMaterial, 16);
    beacon = addSphere(group, 0.1, 0, 1.89, -0.34, warningMaterial, 24);

    addBox(group, 0.16, 0.18, 0.1, -0.22, 0.57, -0.34, accentMaterial);
    addBox(group, 0.16, 0.18, 0.1, 0.22, 0.57, -0.34, accentMaterial);

    var ring = addTorus(group, 0.63, 0.01, 0, 0.15, 0, glassMaterial);
    ring.rotation.x = Math.PI / 2;

    return group;
}

function addLeg(parent, x, y, z, legMaterial, footMaterial) {
    var leg = addCylinder(parent, 0.025, 0.035, 0.42, x, y + 0.12, z, legMaterial, 12);
    leg.rotation.z = x > 0 ? -0.18 : 0.18;
    leg.rotation.x = z > 0 ? 0.18 : -0.18;
    addCylinder(parent, 0.095, 0.13, 0.055, x, 0.055, z, footMaterial, 18);
}

function addPanelGrid(parent, x, y, z, rotationZ, material) {
    var group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.z = rotationZ;
    parent.add(group);

    addBox(group, 0.015, 0.018, 0.34, -0.15, 0.02, 0, material);
    addBox(group, 0.015, 0.018, 0.34, 0, 0.02, 0, material);
    addBox(group, 0.015, 0.018, 0.34, 0.15, 0.02, 0, material);
    addBox(group, 0.56, 0.018, 0.012, 0, 0.02, -0.09, material);
    addBox(group, 0.56, 0.018, 0.012, 0, 0.02, 0.09, material);
}

function addBox(parent, width, height, depth, x, y, z, material) {
    var mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
}

function addCylinder(parent, radiusTop, radiusBottom, height, x, y, z, material, segments) {
    var mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments || 16), material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
}

function addSphere(parent, radius, x, y, z, material, segments) {
    var mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, segments || 16, segments || 16), material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
}

function addTorus(parent, radius, tube, x, y, z, material) {
    var mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 12, 48), material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
}

function bindUiControls() {
    document.getElementById("toggle-animation").addEventListener("click", function () {
        animationEnabled = !animationEnabled;
        this.textContent = animationEnabled ? "Pause animation" : "Start animation";
    });

    document.getElementById("scale-up").addEventListener("click", function () {
        modelScale = Math.min(modelScale + 0.12, 1.8);
        applyModelScale();
    });

    document.getElementById("scale-down").addEventListener("click", function () {
        modelScale = Math.max(modelScale - 0.12, 0.55);
        applyModelScale();
    });

    document.getElementById("change-color").addEventListener("click", function () {
        colorIndex = (colorIndex + 1) % accentColors.length;
        updateAccentColor(accentColors[colorIndex]);
    });

    document.getElementById("reset-model").addEventListener("click", function () {
        modelScale = 1;
        colorIndex = 0;
        animationEnabled = true;
        document.getElementById("toggle-animation").textContent = "Pause animation";
        applyModelScale();
        updateAccentColor(accentColors[colorIndex]);
    });
}

function applyModelScale() {
    stationRoot.scale.set(modelScale, modelScale, modelScale);
    setStatus("Model scale: " + modelScale.toFixed(2) + "x");
}

function updateAccentColor(color) {
    var colorValue = new THREE.Color(color);

    for (var i = 0; i < accentMaterials.length; i += 1) {
        accentMaterials[i].color.copy(colorValue);
    }

    setStatus("Accent color changed.");
}
function showProtocolWarningWhenNeeded() {
    var isLocalhost = location.hostname === "localhost" || location.hostname === "127.0.0.1";

    if (location.protocol !== "https:" && !isLocalhost) {
        setStatus("Use HTTPS or localhost for camera access.");
    }
}

function setStatus(message) {
    var status = document.getElementById("status-message");
    if (status) {
        status.textContent = message;
    }
}

function update(deltaTime, totalTime) {
    if (arToolkitSource.ready !== false) {
        arToolkitContext.update(arToolkitSource.domElement);
    }

    if (!animationEnabled || !stationRoot) {
        return;
    }

    stationRoot.rotation.y = Math.sin(totalTime * 0.8) * 0.08;

    if (radarHead) {
        radarHead.rotation.y += deltaTime * 1.1;
    }

    if (beacon) {
        var pulse = 1 + Math.sin(totalTime * 5) * 0.18;
        beacon.scale.set(pulse, pulse, pulse);
    }

    for (var i = 0; i < solarPanels.length; i += 1) {
        solarPanels[i].rotation.y = Math.sin(totalTime * 0.7 + i) * 0.08;
    }
}

function render() {
    renderer.render(scene, camera);
}

function animate() {
    requestAnimationFrame(animate);
    var deltaTime = clock.getDelta();
    var totalTime = clock.elapsedTime;
    update(deltaTime, totalTime);
    render();
}

import * as THREE from 'three';
import { MultisetClient, DEFAULT_ENDPOINTS } from '@multisetai/vps/core';
import { WebxrController } from '@multisetai/vps/webxr';

const logContainer = document.getElementById('log');
const authorizeButton = document.getElementById('authorize');
const captureButton = document.getElementById('capture');
const canvas = document.getElementById('xr-canvas');
const arButtonContainer = document.getElementById('ar-button-container');

const appendLog = (message) => {
  const timestamp = new Date().toISOString();
  logContainer.style.height = '400px';
  logContainer.style.overflow = 'auto';

  logContainer.textContent += `\n[${timestamp}] ${message}`;
};

// Hide capture button initially
captureButton.style.display = 'none';

const client = new MultisetClient({
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
  code: 'YOUR_MAP_CODE',
  mapType: 'map', // or 'map-set'
  endpoints: DEFAULT_ENDPOINTS,
  onAuthorize: () => appendLog('Authorized'),
  onFrameCaptured: (frame) => appendLog(`Frame captured ${frame.width}x${frame.height}`),
  onCameraIntrinsics: (intrinsics) =>
    appendLog(`Intrinsics fx=${intrinsics.fx} fy=${intrinsics.fy}`),
  onPoseResult: (pose) => appendLog(`Pose result: ${JSON.stringify(pose)}`),
  onError: (error) => appendLog(`Error: ${error instanceof Error ? error.message : String(error)}`),
});

let demoCube = null;
let localizing = false;

const controller = new WebxrController({
  client,
  canvas,
  overlayRoot: document.body,
  buttonContainer: arButtonContainer ?? undefined,
  onARButtonCreated: (button) => {
    appendLog('AR button ready. Tap to start session.');
  },
  onSessionStart: () => {
    appendLog('AR session started');
    captureButton.style.display = 'block';
    captureButton.disabled = false;
  },
  onSessionEnd: () => {
    appendLog('AR session ended');
    captureButton.style.display = 'none';
    captureButton.disabled = true;
  },
});

authorizeButton.addEventListener('click', async () => {
  try {
    await client.authorize();
    appendLog('Authorization succeeded');
    await controller.initialize();

    if (!demoCube) {
      const scene = controller.getScene();
      controller.getRenderer(); // Access renderer in case you need custom configuration.
      controller.getCamera(); // Access camera to tweak clipping planes or fov.

      demoCube = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, 0.1),
        new THREE.MeshBasicMaterial({ color: 0xff0077 })
      );
      demoCube.position.set(0, 0, -0.4);
      scene.add(demoCube);
    }

    // Hide authorize button after successful authorization
    authorizeButton.style.display = 'none';
    appendLog('Click the AR button to start the WebXR AR session.');
  } catch (error) {
    appendLog(`Authorization failed: ${error instanceof Error ? error.message : String(error)}`);
  }
});

captureButton.addEventListener('click', async () => {
  if (localizing) return;

  localizing = true;
  captureButton.disabled = true;
  captureButton.textContent = 'Localizing...';

  try {
    appendLog('Capturing frame...');
    const result = await controller.captureFrame();
    appendLog(`Capture result: ${result ? JSON.stringify(result.localizeData) : 'No pose'}`);
  } catch (error) {
    appendLog(`Capture failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    localizing = false;
    captureButton.disabled = false;
    captureButton.textContent = 'Capture';
  }
});

appendLog('Demo ready. Click Authorize to begin.');


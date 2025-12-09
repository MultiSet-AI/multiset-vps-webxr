# Multiset VPS WebXR

Multiset VPS WebXR is a TypeScript SDK that enables developers to integrate Multiset's Visual Positioning System (VPS) capabilities into WebXR applications. It provides precise 6-DOF (6 degrees of freedom) localization by matching camera frames against cloud-hosted maps, allowing AR applications to understand their position and orientation in physical space.

## Features

- **Core Client** (`@multiset-ai/vps/core`) - Authentication and API client for Multiset VPS services
- **WebXR Controller** (`@multiset-ai/vps/webxr`) - Three.js WebXR session management and frame capture
- **Framework-agnostic** - Works with React, Vue, Angular, or vanilla JavaScript
- **TypeScript support** - Full type definitions included
- **Event-driven architecture** - Comprehensive callbacks for all operations
- **Precise localization** - 6-DOF pose estimation with position and rotation
- **Cloud-based mapping** - Leverages Multiset's cloud infrastructure for map storage and matching

## Installation

```bash
npm install @multiset-ai/vps three
```

> **Note**: `three` is a peer dependency and must be installed separately.

## Requirements

### Runtime Requirements

- **HTTPS**: WebXR requires a secure context. Use HTTPS in production or `https://localhost` for local development.
- **WebXR-capable device**: Android device with ARCore or iOS device with ARKit (via WebXR Viewer or Safari)
- **Modern browser**: Chrome/Edge (Android) or Safari (iOS 15+)
- **Three.js**: Version 0.176.0 or higher (peer dependency)

### Development Requirements

- Node.js 16+ and npm
- TypeScript 5.8+ (for TypeScript projects)

## Quick Start

### 1. Import the SDK

```typescript
import { MultisetClient, DEFAULT_ENDPOINTS } from '@multiset-ai/vps/core';
import { WebxrController } from '@multiset-ai/vps/webxr';
```

### 2. Create and authorize the client

```typescript
const client = new MultisetClient({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  code: 'MAP_YOUR_MAP_CODE',
  mapType: 'map', // or 'map-set'
  endpoints: DEFAULT_ENDPOINTS,
  onAuthorize: (token) => console.log('Authorized:', token),
  onError: (error) => console.error('Error:', error),
});

await client.authorize();
```

### 3. Initialize WebXR controller

```typescript
const controller = new WebxrController({
  client,
  canvas: document.querySelector('canvas'),
  overlayRoot: document.body,
  onSessionStart: () => console.log('AR session started'),
  onSessionEnd: () => console.log('AR session ended'),
});

await controller.initialize();
```

### 4. Capture and localize

```typescript
const result = await controller.captureFrame();
if (result?.localizeData?.poseFound) {
  console.log('Position:', result.localizeData.position);
  console.log('Rotation:', result.localizeData.rotation);
}
```

## Core Client API

### `MultisetClient`

The core client handles authentication and API interactions with Multiset services.

#### Constructor

```typescript
new MultisetClient(config: IMultisetSdkConfig)
```

**Configuration Options:**

```typescript
interface IMultisetSdkConfig {
  clientId: string;                    // Your Multiset client ID
  clientSecret: string;                // Your Multiset client secret
  code: string;                        // Map code (e.g., 'MAP_XXXXX')
  mapType: 'map' | 'map-set';         // Type of map to use
  endpoints?: Partial<IMultisetSdkEndpoints>; // Optional custom endpoints
  onAuthorize?: (token: string) => void;
  onFrameCaptured?: (payload: IFrameCaptureEvent) => void;
  onCameraIntrinsics?: (intrinsics: ICameraIntrinsicsEvent) => void;
  onPoseResult?: (payload: IPoseResultEvent) => void;
  onError?: (error: unknown) => void;
}
```

#### Methods

##### `authorize(): Promise<string>`

Authenticates with Multiset services and obtains an access token. Must be called before making any API requests.

```typescript
const token = await client.authorize();
```

**Returns**: The access token as a string.

#### Events

The client emits events through callback functions:

- **`onAuthorize`**: Called when authorization succeeds with the access token
- **`onFrameCaptured`**: Called when a camera frame is captured for localization
- **`onCameraIntrinsics`**: Called with camera intrinsic parameters
- **`onPoseResult`**: Called with localization results (pose found/not found)
- **`onError`**: Called when any error occurs

## WebXR Controller API

### `WebxrController`

Manages WebXR sessions, Three.js scene, camera, and renderer. Handles AR button creation and frame capture for localization.

#### Constructor

```typescript
new WebxrController(options: IWebxrControllerOptions)
```

**Configuration Options:**

```typescript
interface IWebxrControllerOptions {
  client: MultisetClient;                    // Required: MultisetClient instance
  canvas?: HTMLCanvasElement;                // Optional: Canvas element (created if not provided)
  overlayRoot?: HTMLElement;                 // Optional: Root for DOM overlay (default: document.body)
  buttonContainer?: HTMLElement;             // Optional: Container for AR button
  onARButtonCreated?: (button: HTMLButtonElement) => void;
  onSessionStart?: () => void;
  onSessionEnd?: () => void;
}
```

#### Methods

##### `initialize(buttonContainer?: HTMLElement): Promise<HTMLButtonElement>`

Initializes the WebXR controller, sets up Three.js scene/renderer/camera, and creates the AR button.

```typescript
const arButton = await controller.initialize(buttonContainer);
```

**Returns**: The created AR button element.

##### `captureFrame(): Promise<ILocalizeAndMapDetails | null>`

Captures the current camera frame and performs localization.

```typescript
const result = await controller.captureFrame();
if (result?.localizeData?.poseFound) {
  const { position, rotation, confidence } = result.localizeData;
  console.log('Localized at:', position);
}
```

**Returns**: Object with `localizeData` and optional `mapDetails`, or `null` if capture fails.

##### `getScene(): THREE.Scene`

Gets the Three.js scene object for adding 3D models and objects.

```typescript
const scene = controller.getScene();
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
```

##### `getCamera(): THREE.PerspectiveCamera`

Gets the Three.js camera object for custom camera configuration.

```typescript
const camera = controller.getCamera();
camera.near = 0.1;
camera.far = 1000;
```

##### `getRenderer(): THREE.WebGLRenderer`

Gets the Three.js WebGL renderer for advanced rendering configuration.

```typescript
const renderer = controller.getRenderer();
renderer.shadowMap.enabled = true;
```

##### `hasActiveSession(): boolean`

Checks if an active WebXR session is currently running.

```typescript
if (controller.hasActiveSession()) {
  // AR session is active
}
```

##### `dispose(): void`

Cleans up resources and removes event listeners. Call this when destroying the controller.

```typescript
controller.dispose();
```

## Type Definitions

All TypeScript types are exported from the main entry points:

```typescript
// Core types
import type {
  IMultisetSdkConfig,
  IMultisetSdkEndpoints,
  IFrameCaptureEvent,
  ICameraIntrinsicsEvent,
  IPoseResultEvent,
  ILocalizeAndMapDetails,
  MapType,
} from '@multiset-ai/vps/core';

// WebXR types
import type {
  IWebxrControllerOptions,
} from '@multiset-ai/vps/webxr';
```

## Examples

### Vanilla JavaScript

```javascript
import * as THREE from 'three';
import { MultisetClient, DEFAULT_ENDPOINTS } from '@multiset-ai/vps/core';
import { WebxrController } from '@multiset-ai/vps/webxr';

const client = new MultisetClient({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  code: 'MAP_YOUR_MAP_CODE',
  mapType: 'map',
  endpoints: DEFAULT_ENDPOINTS,
  onAuthorize: (token) => console.log('Authorized:', token),
  onError: (error) => console.error('Error:', error),
});

const controller = new WebxrController({
  client,
  canvas: document.querySelector('canvas'),
  overlayRoot: document.body,
  onSessionStart: () => console.log('AR session started'),
  onSessionEnd: () => console.log('AR session ended'),
});

// Authorize and initialize
await client.authorize();
await controller.initialize();

// Add 3D objects to scene
const scene = controller.getScene();
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(0.1, 0.1, 0.1),
  new THREE.MeshBasicMaterial({ color: 0xff0077 })
);
cube.position.set(0, 0, -0.4);
scene.add(cube);

// Capture and localize
const result = await controller.captureFrame();
if (result?.localizeData?.poseFound) {
  console.log('Position:', result.localizeData.position);
}
```

### React

```tsx
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MultisetClient, DEFAULT_ENDPOINTS } from '@multiset-ai/vps/core';
import { WebxrController } from '@multiset-ai/vps/webxr';

export default function App() {
  const [authorized, setAuthorized] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clientRef = useRef<MultisetClient | null>(null);
  const controllerRef = useRef<WebxrController | null>(null);

  useEffect(() => {
    clientRef.current = new MultisetClient({
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
      code: 'MAP_YOUR_MAP_CODE',
      mapType: 'map',
      endpoints: DEFAULT_ENDPOINTS,
    });

    controllerRef.current = new WebxrController({
      client: clientRef.current,
      canvas: canvasRef.current!,
    });

    return () => {
      controllerRef.current?.dispose();
    };
  }, []);

  const handleAuthorize = async () => {
    await clientRef.current!.authorize();
    await controllerRef.current!.initialize();
    
    // Add 3D objects
    const scene = controllerRef.current!.getScene();
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xff0077 })
    );
    scene.add(cube);
    
    setAuthorized(true);
  };

  const handleCapture = async () => {
    const result = await controllerRef.current!.captureFrame();
    if (result?.localizeData?.poseFound) {
      console.log('Localized!', result.localizeData.position);
    }
  };

  return (
    <div>
      <button onClick={handleAuthorize} disabled={authorized}>
        Authorize
      </button>
      <button onClick={handleCapture} disabled={!authorized}>
        Capture
      </button>
      <canvas ref={canvasRef} />
    </div>
  );
}
```

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)


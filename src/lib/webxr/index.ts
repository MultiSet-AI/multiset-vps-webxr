import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';

import type {
  MultisetClient,
  ICameraIntrinsicsEvent,
  IFrameCaptureEvent,
  ILocalizeAndMapDetails,
} from '../core';

export interface IWebxrControllerOptions {
  client: MultisetClient;
  canvas?: HTMLCanvasElement;
  overlayRoot?: HTMLElement;
  buttonContainer?: HTMLElement;
  onARButtonCreated?: (button: HTMLButtonElement) => void;
  onSessionStart?: () => void;
  onSessionEnd?: () => void;
}

type XRViewWithCamera = XRView & {
  camera?: {
    width: number;
    height: number;
    [key: string]: unknown;
  };
};

type XRWebGLBindingLike = {
  getCameraImage: (camera: XRViewWithCamera['camera']) => WebGLTexture | null;
};

export class WebxrController {
  private renderer: THREE.WebGLRenderer | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private scene: THREE.Scene | null = null;
  private animationLoop: (() => void) | null = null;
  private arButton: HTMLButtonElement | null = null;
  private resizeHandler: (() => void) | null = null;
  private isSessionActive: boolean = false;

  constructor(private readonly options: IWebxrControllerOptions) { }

  async initialize(buttonContainer?: HTMLElement): Promise<HTMLButtonElement> {
    if (this.renderer) {
      return this.arButton!;
    }

    if (!window.isSecureContext) {
      throw new Error('WebXR requires a secure context (HTTPS).');
    }

    const canvas = this.options.canvas ?? document.createElement('canvas');

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.xr.enabled = true;

    // Listen for session start/end events
    renderer.xr.addEventListener('sessionstart', () => {
      this.isSessionActive = true;
      this.options.onSessionStart?.();
    });

    renderer.xr.addEventListener('sessionend', () => {
      this.isSessionActive = false;
      this.options.onSessionEnd?.();
    });

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.2,
      10000
    );

    const scene = new THREE.Scene();

    const animationLoop = () => {
      renderer.render(scene, camera);
    };
    renderer.setAnimationLoop(animationLoop);

    const resizeHandler = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', resizeHandler);

    const overlayRoot = this.options.overlayRoot ?? document.body;
    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ['camera-access', 'dom-overlay'],
      domOverlay: { root: overlayRoot },
    }) as HTMLButtonElement;

    // Get container at initialization time (like App.tsx does with getElementById)
    // This ensures the container exists in the DOM when we try to append
    // Priority: passed parameter > options.buttonContainer > overlayRoot
    const buttonParent = (buttonContainer && buttonContainer instanceof HTMLElement)
      ? buttonContainer
      : (this.options.buttonContainer && this.options.buttonContainer instanceof HTMLElement)
        ? this.options.buttonContainer
        : overlayRoot;

    if (!buttonParent.contains(arButton)) {
      buttonParent.appendChild(arButton);
    }

    this.renderer = renderer;
    this.camera = camera;
    this.scene = scene;
    this.animationLoop = animationLoop;
    this.arButton = arButton;
    this.resizeHandler = resizeHandler;

    this.options.onARButtonCreated?.(arButton);
    return arButton;
  }

  getScene(): THREE.Scene {
    if (!this.scene) {
      throw new Error('Scene: WebXR controller has not been initialized.');
    }
    return this.scene;
  }

  getCamera(): THREE.PerspectiveCamera {
    if (!this.camera) {
      throw new Error('Camera: WebXR controller has not been initialized.');
    }
    return this.camera;
  }

  getRenderer(): THREE.WebGLRenderer {
    if (!this.renderer) {
      throw new Error('Renderer: WebXR controller has not been initialized.');
    }
    return this.renderer;
  }

  hasActiveSession(): boolean {
    return this.isSessionActive && this.renderer?.xr.isPresenting === true;
  }

  async captureFrame(): Promise<ILocalizeAndMapDetails | null> {
    const renderer = this.renderer;
    const camera = this.camera;
    if (!renderer || !camera) {
      throw new Error('WebXR: WebXR controller has not been initialized.');
    }

    const session = renderer.xr.getSession?.();
    if (!session) {
      throw new Error('WebXR Session: No active WebXR session. Start AR before capturing.');
    }

    const referenceSpace = renderer.xr.getReferenceSpace();
    if (!referenceSpace) {
      throw new Error('WebXR Reference Space: Unable to acquire XR reference space.');
    }

    const gl = renderer.getContext();

    return new Promise((resolve, reject) => {
      session.requestAnimationFrame(async (_time: number, xrFrame: XRFrame) => {
        try {
          const viewerPose = xrFrame.getViewerPose(referenceSpace);
          if (!viewerPose) {
            resolve(null);
            return;
          }

          for (const view of viewerPose.views as XRViewWithCamera[]) {
            const xrCamera = view.camera;
            if (!xrCamera) continue;

            const gl2 = gl as unknown as WebGL2RenderingContext;
            const bindingCtor = XRWebGLBinding as unknown as {
              new(session: XRSession, context: WebGL2RenderingContext): XRWebGLBindingLike;
            };
            const binding = new bindingCtor(session, gl2);
            const cameraTexture = binding.getCameraImage?.(xrCamera) ?? null;
            if (!cameraTexture) continue;

            const width = xrCamera.width;
            const height = xrCamera.height;
            if (!width || !height) continue;

            const frameData = await getCameraTextureAsImage(
              renderer,
              cameraTexture,
              width,
              height
            );

            const intrinsics = getCameraIntrinsics(view.projectionMatrix, {
              width,
              height,
              x: 0,
              y: 0,
            });

            if (frameData && intrinsics) {
              const result = await this.options.client.localizeWithFrame(
                frameData,
                intrinsics
              );

              resolve(result);
              return;
            }
          }

          resolve(null);
        } catch (error) {
          reject(error);
        } finally {
          gl.bindFramebuffer(
            gl.FRAMEBUFFER,
            session.renderState.baseLayer?.framebuffer ?? null
          );
        }
      });
    });
  }

  dispose(): void {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    this.animationLoop = null;
    this.camera = null;
    this.scene = null;

    if (this.arButton?.parentElement) {
      this.arButton.parentElement.removeChild(this.arButton);
    }
    this.arButton = null;
  }
}

function getCameraIntrinsics(
  projectionMatrix: Float32Array,
  viewport: XRViewport
): ICameraIntrinsicsEvent {
  const p = projectionMatrix;
  const u0 = ((1 - p[8]) * viewport.width) / 2 + viewport.x;
  const v0 = ((1 - p[9]) * viewport.height) / 2 + viewport.y;
  const ax = (viewport.width / 2) * p[0];
  const ay = (viewport.height / 2) * p[5];

  return {
    fx: ax,
    fy: ay,
    px: u0,
    py: v0,
    width: viewport.width,
    height: viewport.height,
  };
}

async function compressToJpeg(
  buffer: ArrayBuffer,
  width: number,
  height: number,
  quality = 0.8
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = width;
  canvas.height = height;

  const imageData = new ImageData(new Uint8ClampedArray(buffer), width, height);
  ctx?.putImageData(imageData, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? new Blob()), 'image/jpeg', quality);
  });
}

async function getCameraTextureAsImage(
  renderer: THREE.WebGLRenderer,
  webGLTexture: WebGLTexture,
  width: number,
  height: number
): Promise<IFrameCaptureEvent | null> {
  const gl = renderer.getContext();
  if (!gl) return null;

  const framebuffer = gl.createFramebuffer();
  if (!framebuffer) return null;

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    webGLTexture,
    0
  );

  const pixelBuffer = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixelBuffer);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.deleteFramebuffer(framebuffer);

  const flippedData = new Uint8ClampedArray(pixelBuffer.length);
  for (let row = 0; row < height; row += 1) {
    const sourceStart = row * width * 4;
    const destStart = (height - row - 1) * width * 4;
    flippedData.set(
      pixelBuffer.subarray(sourceStart, sourceStart + width * 4),
      destStart
    );
  }

  const blob = await compressToJpeg(flippedData.buffer, width, height, 0.7);

  if (!blob.size) {
    return null;
  }

  return {
    blob,
    width,
    height,
  };
}


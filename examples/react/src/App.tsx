import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { MultisetClient, DEFAULT_ENDPOINTS } from "@multisetai/vps/core";
import { WebxrController } from "@multisetai/vps/webxr";

const CLIENT_CONFIG = {
  clientId: "YOUR_CLIENT_ID",
  clientSecret: "YOUR_CLIENT_SECRET",
  code: "YOUR_MAP_CODE", // map or map-set code
  mapType: "map" as const, // map or map-set
};

export default function App() {
  const [authorized, setAuthorized] = useState(false);
  const [arSessionActive, setArSessionActive] = useState(false);
  const [localizing, setLocalizing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const arButtonContainerRef = useRef<HTMLDivElement | null>(null);
  const logContainerRef = useRef<HTMLPreElement | null>(null);
  const clientRef = useRef<MultisetClient | null>(null);
  const controllerRef = useRef<WebxrController | null>(null);
  const demoCubeRef = useRef<THREE.Mesh | null>(null);

  const appendLog = useCallback((message: string) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    if (logContainerRef.current) {
      logContainerRef.current.textContent += `\n${logMessage}`;
    }
  }, []);

  // Initialize client
  useEffect(() => {
    clientRef.current = new MultisetClient({
      ...CLIENT_CONFIG,
      endpoints: DEFAULT_ENDPOINTS,
      onAuthorize: () => appendLog("Authorized"),
      onFrameCaptured: (frame) =>
        appendLog(`Frame captured ${frame.width}x${frame.height}`),
      onCameraIntrinsics: (intrinsics) =>
        appendLog(`Intrinsics fx=${intrinsics.fx} fy=${intrinsics.fy}`),
      onPoseResult: (pose) => appendLog(`Pose result: ${JSON.stringify(pose)}`),
      onError: (error) =>
        appendLog(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        ),
    });

    return () => {
      controllerRef.current?.dispose();
      controllerRef.current = null;
    };
  }, [appendLog]);

  // Initialize WebXR controller
  useEffect(() => {
    if (!canvasRef.current || !clientRef.current) return;

    controllerRef.current = new WebxrController({
      client: clientRef.current,
      canvas: canvasRef.current,
      overlayRoot: document.body,
      buttonContainer: arButtonContainerRef.current ?? undefined,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onARButtonCreated: (_button) => {
        appendLog("AR button ready. Tap to start session.");
      },
      onSessionStart: () => {
        appendLog("AR session started");
        setArSessionActive(true);
      },
      onSessionEnd: () => {
        appendLog("AR session ended");
        setArSessionActive(false);
      },
    });

    return () => {
      controllerRef.current?.dispose();
      controllerRef.current = null;
    };
  }, [appendLog]);

  const handleAuthorize = async () => {
    try {
      if (!clientRef.current || !controllerRef.current) return;
      await clientRef.current.authorize();
      const container = arButtonContainerRef.current;
      if (!container) {
        throw new Error("AR button container is not available");
      }
      await controllerRef.current.initialize(container);

      if (!demoCubeRef.current) {
        const scene = controllerRef.current.getScene();
        controllerRef.current.getRenderer();
        controllerRef.current.getCamera();

        demoCubeRef.current = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.1, 0.1),
          new THREE.MeshBasicMaterial({ color: 0xff0077 })
        );
        demoCubeRef.current.position.set(0, 0, -0.4);
        scene.add(demoCubeRef.current);
      }

      setAuthorized(true);
    } catch (error) {
      appendLog(
        `Authorization failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const handleCapture = async () => {
    setLocalizing(true);
    try {
      if (!controllerRef.current) return;
      const result = await controllerRef.current.captureFrame();
      appendLog(
        `Capture result: ${
          result ? JSON.stringify(result.localizeData) : "No pose"
        }`
      );
    } catch (error) {
      appendLog(
        `Capture failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setLocalizing(false);
    }
  };

  useEffect(() => {
    appendLog("Demo ready. Click Authorize to begin.");
  }, [appendLog]);

  return (
    <div id="app">
      <h1>Multiset SDK React Demo</h1>

      {/* Step 1: Authorize button - always visible, disabled after authorization */}
      {!authorized && (
        <button id="authorize" onClick={handleAuthorize}>
          Authorize
        </button>
      )}

      {/* Step 2: AR button container - visible only after authorization */}
      <div
        id="ar-button-container"
        ref={arButtonContainerRef}
        style={{ display: authorized ? "block" : "none" }}
      ></div>

      {/* Step 3: Capture button - visible only when AR session is active */}
      {arSessionActive && (
        <button id="capture" onClick={handleCapture} disabled={localizing}>
          {localizing ? "Localizing..." : "Capture"}
        </button>
      )}

      <pre
        id="log"
        ref={logContainerRef}
        style={{ height: "400px", overflow: "auto" }}
      ></pre>
      <canvas id="xr-canvas" ref={canvasRef}></canvas>
    </div>
  );
}

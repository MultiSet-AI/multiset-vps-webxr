# Multiset SDK React Demo

A React demo application showcasing the Multiset Visual Positioning System (VPS) API for WebXR applications. This demo demonstrates AR localization using React, Three.js, and the [@multisetai/vps](https://www.npmjs.com/package/@multisetai/vps) SDK.

## Features

- **WebXR AR Integration**: Full WebXR AR session management with camera access
- **Sequential UI Flow**: Step-by-step user interface (Authorize → Start AR → Capture)
- **Real-time Localization**: Capture frames and get pose results using Multiset VPS API
- **3D Scene Rendering**: Three.js integration for 3D visualization
- **Event Logging**: Comprehensive logging of all SDK events

## Requirements

### HTTPS Required

**This application requires HTTPS to function properly.** WebXR APIs require a secure context (HTTPS) to access device cameras and sensors. HTTPS must be configured in your production environment (handled by your hosting provider).

### Domain Whitelisting

**Important**: To test this application, your domain must be whitelisted in the Multiset system. The VPS API requires domain authorization for security purposes.

**⚠️ Local testing is not supported.** This application must be deployed to a whitelisted domain with HTTPS enabled.

**Need to whitelist your domain?** Contact us on Discord: [https://discord.gg/pftwqThTxb](https://discord.gg/pftwqThTxb)

Please provide your domain name when requesting whitelisting.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- A browser that supports WebXR (Chrome for Android, Edge, or other WebXR-compatible browsers)

### Installation

1. Navigate to this example directory:
   ```bash
   cd examples/react
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration

Edit `src/App.tsx` and update the `CLIENT_CONFIG` object with your credentials:

```typescript
const CLIENT_CONFIG = {
  clientId: "YOUR_CLIENT_ID",
  clientSecret: "YOUR_CLIENT_SECRET",
  code: "YOUR_MAP_CODE",
  mapType: "map" as const,
};
```

### Building for Production

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Usage Flow

The application follows a sequential workflow:

1. **Authorize**: Click the "Authorize" button to authenticate with the Multiset API
2. **Start AR**: After authorization, an AR button will appear. Click it to start the WebXR AR session
3. **Capture**: Once the AR session is active, the "Capture" button will appear. Use it to capture frames and get localization results

All events and results are logged in the log panel at the bottom of the page.

## Project Structure

```
examples/react/
├── src/
│   ├── App.tsx          # Main React component with AR logic
│   ├── main.tsx         # React entry point
│   └── style.css        # Application styles
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
└── README.md           # This file
```

## Browser Compatibility

This application requires a browser with WebXR support:

- **Chrome for Android** (recommended)
- **Microsoft Edge** (with WebXR support)
- **Other WebXR-compatible browsers**

Desktop browsers typically require additional setup or may not support WebXR AR sessions.

## Troubleshooting

### WebXR Not Available

- Ensure you're using an HTTPS connection
- Check that your browser supports WebXR
- On mobile, use Chrome for Android
- Verify that WebXR is enabled in your browser settings

### Domain Not Whitelisted

If you receive authorization errors, your domain may not be whitelisted. Contact us on [Discord](https://discord.gg/pftwqThTxb) to request domain whitelisting.

## Support

For issues, questions, or to request domain whitelisting:

- **Discord**: [https://discord.gg/pftwqThTxb](https://discord.gg/pftwqThTxb)
- **NPM Package**: [@multisetai/vps](https://www.npmjs.com/package/@multisetai/vps)

## License

See the main repository for license information.


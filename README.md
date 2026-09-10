# Inside the Human Heart — VR Anatomy Explorer

An interactive React + Three.js anatomy experience for inspecting the heart's four chambers and major blood vessels in desktop, mobile, and WebXR headset modes.

## Features

- Four individually selectable and labeled chambers
- Animated cardiac pulse and directional blood-flow paths
- Aorta, pulmonary artery, pulmonary veins, superior vena cava, and inferior vena cava
- Cutaway/exterior view toggle
- Guided camera focus and educational anatomy panels
- WebXR `Enter VR` support on compatible browsers/headsets
- Mouse, touch, and mobile-responsive controls

## Run locally

```bash
npm install
npm run dev
```

Open the local address printed by Vite. For VR, use a WebXR-compatible browser and serve the site over HTTPS (or localhost), then select **Enter VR**.

## Controls

- Drag: rotate the model
- Scroll/pinch: zoom
- Select a chamber in the left navigator or click a structure
- Toggle **Cutaway** to expose chamber cavities
- Select **Reset view** to return to the full heart

## Build

```bash
npm run build
```

The optimized output is written to `dist/`.

> Educational visualization only; not intended for diagnosis or clinical planning.

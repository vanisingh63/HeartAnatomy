# Organ Explorer VR — Heart Module (Starter)

Interactive 3D heart: click to fly inside, watch chambers pulse, see blood flow
through arteries/veins. Built with React + Vite + Three.js (react-three-fiber).

## Get it running (5 minutes)

1. **Install dependencies**
   ```
   npm install
   ```

2. **Get a heart model** — download one of these free anatomically-labeled
   GLB models (look for ones with separate meshes for atria/ventricles/vessels,
   not one solid mesh):
   - https://sketchfab.com/3d-models/anatomically-correct-human-heart-54fa880728d14c11afff78be8721620a
   - https://sketchfab.com/3d-models/human-heart-3d-model-dbe2a848511644e2923b613d2d12ff09
   - https://sketchfab.com/3d-models/human-heart-3d-model-anatomy-medical-project-5da08bb137014f0392c69f9997f777cd

   Export/download as **.glb**, rename it to `heart.glb`, and place it at:
   ```
   public/models/heart.glb
   ```

3. **Run it**
   ```
   npm run dev
   ```
   Open the URL it gives you. Open the browser console (F12) — it will print
   every mesh name found in your model. Compare those to the keyword lists in
   `src/components/HeartScene.jsx` (`CHAMBER_KEYWORDS`) and tweak if the
   auto-matching didn't catch your model's naming.

4. **Test on phone (for cardboard, later)**: your terminal will also show a
   "Network" URL (something like `http://192.168.x.x:5173`) — open that on
   your phone while it's on the same WiFi to preview on mobile.

## What's already working

- Click the heart → camera flies inside
- Ventricles pulse like a heartbeat (procedural, not tied to real audio/ECG yet)
- Two blood-flow particle streams (red = arterial, blue = venous) — currently
  procedural curves as a placeholder until you map real vessel geometry
- Idle auto-rotation on the outer view

## 3-week roadmap (for the full expo, not tomorrow)

**This week (concept validation — what you're showing mam tomorrow):**
- ✅ Interactive click-to-enter heart, chambers, placeholder blood flow

**Week 2:**
- Swap placeholder vessel curves for real geometry paths from the model
- Add on-screen labels for each chamber (`<Html>` from drei, appears once "entered")
- Add a simple info panel per chamber (name + one-line function) — reuse this
  same panel pattern for the other two organs later
- Improve lighting/materials for a more "hyper-realistic" wet-tissue look
  (subsurface-scattering-style shader or at minimum higher-res textures + normal maps)

**Week 3:**
- Add real cardboard/VR stereo split-screen mode (Three.js has `THREE.StereoCamera`
  built in for exactly this — happy to build that toggle when you're ready)
- Build out organs #2 and #3 by duplicating this same component pattern
  (`HeartScene.jsx` → `LungScene.jsx` etc.) — the click-to-enter, pulse, and
  particle-stream logic is already reusable
- Polish: intro screen, organ-selection menu, transitions between organs

## Tech stack

- React 18 + Vite
- Three.js + @react-three/fiber + @react-three/drei
- GSAP (camera fly-in animation)
- Deployed the same way as your other projects: Vercel

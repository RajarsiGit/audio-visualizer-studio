# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server with HMR
- `npm run build` — type-check (`tsc -b`) then production build (`vite build`)
- `npm run lint` — run Oxlint
- `npm run preview` — serve the production build locally

There is no test suite configured in this project.

## Architecture

This is a client-only React + TypeScript app (no backend) that visualizes audio in real time on a `<canvas>` using the Web Audio API. Styling is Tailwind CSS v4 via `@tailwindcss/vite` (no `tailwind.config.js` — v4 is CSS-driven, see `src/index.css`).

The app has three concerns that are deliberately kept separate:

**1. Audio engine (`src/audio/useAudioEngine.ts`)**
A hook that owns the `AudioContext`, a single shared `AnalyserNode`, and two mutually-exclusive input sources:
- Microphone via `getUserMedia` → `MediaStreamAudioSourceNode` → analyser only (never connected to `ctx.destination`, otherwise it would feed back into the mic and howl).
- File playback via a hidden `<audio>` element → `MediaElementAudioSourceNode` → analyser → `ctx.destination` (so you can hear it).

Switching sources tears down the previous routing (`stopMicTracks`, `analyser.disconnect()`) before wiring the new one. `fftSize` and `smoothingTimeConstant` are applied reactively to the existing analyser rather than recreating it. The hook exposes `analyserRef` (a ref, not state) so the render loop can pull data every frame without triggering React re-renders.

**2. Render loop (`src/components/VisualizerCanvas.tsx`)**
Owns the actual `requestAnimationFrame` loop. Each frame it reads `analyserRef.current`, pulls frequency/time-domain data, computes frequency bands via `src/audio/bands.ts` (bass/mid/treble = averaged FFT bins over fixed Hz ranges), packages it all into a `Frame` object (see `src/visualizers/types.ts`), and calls `renderer.draw(ctx, width, height, frame)`. It also handles canvas resizing/DPR scaling via `ResizeObserver`. This component knows nothing about which visualizer is active — it just calls whatever `VisualizerRenderer` it's given.

**3. Visualizers (`src/visualizers/`)**
Each visualizer (`bars.ts`, `waveform.ts`, `particles.ts`) is a factory function `createXRenderer(theme: Theme) => VisualizerRenderer` — a plain object with an `id`, `label`, and a `draw` function that does direct 2D canvas drawing (gradients, shadow blur for glow, etc.) driven by the current `Frame`. There's no class hierarchy or plugin registry beyond the array built in `App.tsx`; to add a new visualizer, create a new factory following the same shape and add it to the `visualizers` array in `App.tsx` plus the barrel export in `src/visualizers/index.ts`.

Color themes (`src/visualizers/themes.ts`) are plain data (`Theme[]`) consumed by every visualizer factory — switching themes just recreates the renderers via `useMemo` keyed on `theme`.

`App.tsx` is the composition root: it owns UI state (fft size, smoothing, active visualizer id, theme index, fullscreen/drag state), wires `useAudioEngine` output into `VisualizerCanvas`, and passes everything else down to `ControlBar` (the bottom control dock — source selection, visualizer/theme pickers, playback scrubber, fft/smoothing sliders).

## Static assets

`index.html` carries meta tags for SEO/social sharing (Open Graph, Twitter Card). `public/og-image.png` is a pre-rendered 1200×630 social preview image generated from `public/favicon.svg`; if the logo/branding changes, regenerate it rather than hand-editing the PNG.

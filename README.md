# Audio Visualizer Studio

A browser-based tool for creating real-time, audio-reactive visualizations from music files or your microphone — no backend, no upload, everything runs client-side on `<canvas>` via the Web Audio API.

## Features

- **Two audio sources**: drag-and-drop / choose an audio file, or use the live microphone
- **Three visualizers**: Bars, Waveform, and Particles, each reacting to bass/mid/treble bands
- **Four color themes**: Neon Purple, Sunset, Cyan Green, Mono White
- **Playback controls** for file mode: play/pause, seek, elapsed/duration
- **Tunable analysis**: adjustable FFT size and smoothing
- **Fullscreen mode** for projecting the visualization

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL, and either drop an audio file onto the page or click **Microphone** to visualize live input.

## Scripts

| Command           | Description                                    |
| ------------------ | ----------------------------------------------- |
| `npm run dev`      | Start the Vite dev server with HMR              |
| `npm run build`    | Type-check and build for production             |
| `npm run preview`  | Preview the production build locally            |
| `npm run lint`     | Run Oxlint                                      |

## Tech stack

- [React 19](https://react.dev/) + TypeScript
- [Vite](https://vite.dev/) for dev/build tooling
- [Tailwind CSS v4](https://tailwindcss.com/) for styling
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) for audio analysis
- [Oxlint](https://oxc.rs/) for linting

## How it works

Audio (from a file or the microphone) is routed through a single Web Audio `AnalyserNode`. On every animation frame, the app reads frequency and time-domain data from that analyser, derives bass/mid/treble levels, and hands the result to the active visualizer, which draws directly to a 2D canvas. See [`CLAUDE.md`](./CLAUDE.md) for a deeper architecture breakdown.

## License

GNU General Public License v3.0 — see [LICENSE](./LICENSE) for details.

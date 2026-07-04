// Barrel export — add new visualizer factories here alongside the array in App.tsx.
export type { Frame, VisualizerRenderer, Theme } from './types';
export { THEMES } from './themes';
export { createBarsRenderer } from './bars';
export { createWaveformRenderer } from './waveform';
export { createParticlesRenderer } from './particles';

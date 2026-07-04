// Shared contract between the render loop (VisualizerCanvas) and each
// visualizer factory in this directory.

// Per-frame audio data computed by the render loop and passed to every visualizer's draw call.
export interface Frame {
  freq: Uint8Array; // frequency-domain bytes (0-255) from getByteFrequencyData
  time: Uint8Array; // time-domain bytes (0-255, centered at 128) from getByteTimeDomainData
  bass: number; // 0-1 averaged band energy, see src/audio/bands.ts
  mid: number;
  treble: number;
  dt: number; // seconds since last frame, clamped
}

// What a visualizer factory (createXRenderer) must return. No class hierarchy —
// this plain-object shape is the entire plugin contract.
export interface VisualizerRenderer {
  id: string;
  label: string;
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number, frame: Frame) => void;
}

export interface Theme {
  name: string;
  colors: string[];
  background: string;
  glow: string;
}

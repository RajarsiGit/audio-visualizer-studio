export interface Frame {
  freq: Uint8Array;
  time: Uint8Array;
  bass: number;
  mid: number;
  treble: number;
  dt: number;
}

export interface VisualizerRenderer {
  id: string;
  label: string;
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number, frame: Frame) => void;
}

export interface Theme {
  name: string;
  colors: [string, string, string];
  background: string;
  glow: string;
}

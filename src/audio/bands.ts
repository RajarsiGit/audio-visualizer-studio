// Reduces a full FFT bin array down to three perceptual bands (bass/mid/treble)
// so visualizers can react to broad frequency ranges instead of raw bins.

export interface Bands {
  bass: number;
  mid: number;
  treble: number;
}

const BASS_RANGE: [number, number] = [20, 250];
const MID_RANGE: [number, number] = [250, 4000];
const TREBLE_RANGE: [number, number] = [4000, 12000];

// Averages FFT bins whose center frequency falls within [loHz, hiHz], normalized to 0-1.
function averageInRange(freq: Uint8Array, binHz: number, loHz: number, hiHz: number): number {
  const lo = Math.max(0, Math.floor(loHz / binHz));
  const hi = Math.min(freq.length - 1, Math.ceil(hiHz / binHz));
  if (hi <= lo) return 0;

  let sum = 0;
  for (let i = lo; i <= hi; i++) sum += freq[i];
  return sum / (hi - lo + 1) / 255;
}

export function computeBands(freq: Uint8Array, sampleRate: number): Bands {
  if (freq.length === 0) return { bass: 0, mid: 0, treble: 0 };

  // Each bin covers (sampleRate / 2) / binCount Hz, since FFT bins span 0..nyquist.
  const nyquist = sampleRate / 2;
  const binHz = nyquist / freq.length;

  return {
    bass: averageInRange(freq, binHz, BASS_RANGE[0], BASS_RANGE[1]),
    mid: averageInRange(freq, binHz, MID_RANGE[0], MID_RANGE[1]),
    treble: averageInRange(freq, binHz, TREBLE_RANGE[0], TREBLE_RANGE[1]),
  };
}

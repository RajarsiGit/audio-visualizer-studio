import type { Theme, VisualizerRenderer } from './types';

// Classic frequency-bar spectrum: subsamples the FFT bins down to a fixed
// number of bars and grows the glow with bass energy.
export function createBarsRenderer(theme: Theme): VisualizerRenderer {
  return {
    id: 'bars',
    label: 'Bars',
    draw(ctx, w, h, { freq, bass }) {
      ctx.fillStyle = theme.background;
      ctx.fillRect(0, 0, w, h);
      if (freq.length === 0) return;

      const barCount = Math.min(96, freq.length);
      const step = Math.floor(freq.length / barCount);
      const gap = 3;
      const barWidth = w / barCount - gap;

      const grad = ctx.createLinearGradient(0, h, 0, 0);
      const stops = theme.colors;
      stops.forEach((color, i) => grad.addColorStop(i / (stops.length - 1), color));

      // shadowBlur is used purely as a cheap glow effect, not a real shadow.
      ctx.shadowColor = theme.glow;
      ctx.shadowBlur = 12 + bass * 30;
      ctx.fillStyle = grad;

      for (let i = 0; i < barCount; i++) {
        const value = freq[i * step] / 255;
        const barHeight = Math.max(2, value * h * 0.9);
        const x = i * (barWidth + gap);
        ctx.fillRect(x, h - barHeight, barWidth, barHeight);
      }
      ctx.shadowBlur = 0;
    },
  };
}

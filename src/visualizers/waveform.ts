import type { Theme, VisualizerRenderer } from './types';

export function createWaveformRenderer(theme: Theme): VisualizerRenderer {
  return {
    id: 'waveform',
    label: 'Waveform',
    draw(ctx, w, h, { time, treble }) {
      ctx.fillStyle = theme.background;
      ctx.fillRect(0, 0, w, h);
      if (time.length === 0) return;

      const grad = ctx.createLinearGradient(0, 0, w, 0);
      const stops = theme.colors;
      stops.forEach((color, i) => grad.addColorStop(i / (stops.length - 1), color));

      ctx.lineWidth = 2 + treble * 3;
      ctx.strokeStyle = grad;
      ctx.shadowColor = theme.glow;
      ctx.shadowBlur = 10 + treble * 20;
      ctx.beginPath();

      const sliceWidth = w / time.length;
      let x = 0;
      for (let i = 0; i < time.length; i++) {
        const v = time[i] / 128 - 1;
        const y = h / 2 + v * (h / 2) * 0.85;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    },
  };
}

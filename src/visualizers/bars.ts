import type { Theme, VisualizerRenderer } from './types';

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
      grad.addColorStop(0, theme.colors[0]);
      grad.addColorStop(0.6, theme.colors[1]);
      grad.addColorStop(1, theme.colors[2]);

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

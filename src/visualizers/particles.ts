import type { Theme, VisualizerRenderer } from './types';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  colorMix: number;
}

const MAX_PARTICLES = 600;

export function createParticlesRenderer(theme: Theme): VisualizerRenderer {
  let particles: Particle[] = [];
  let prevBass = 0;
  let bassEnvelope = 0;

  function spawnBurst(cx: number, cy: number, count: number, power: number) {
    for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.5 + Math.random() * 1.5) * (80 + power * 260);
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.8,
        size: 1.5 + Math.random() * 2.5,
        colorMix: Math.random(),
      });
    }
  }

  return {
    id: 'particles',
    label: 'Particles',
    draw(ctx, w, h, { bass, mid, treble, dt }) {
      ctx.fillStyle = theme.background;
      ctx.fillRect(0, 0, w, h);

      bassEnvelope = Math.max(bass, bassEnvelope - dt * 2.5);
      const delta = bass - prevBass;
      prevBass = bass;

      const cx = w / 2;
      const cy = h / 2;

      if (bass > 0.55 && delta > 0.08) {
        spawnBurst(cx, cy, 18 + Math.floor(bass * 40), bass);
      }
      if (Math.random() < mid * 0.6) {
        spawnBurst(cx, cy, 1, mid * 0.3);
      }

      for (const p of particles) {
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.98;
        p.vy *= 0.98;
      }
      particles = particles.filter((p) => p.life < p.maxLife);

      ctx.shadowColor = theme.glow;
      ctx.shadowBlur = 8;
      for (const p of particles) {
        const t = p.life / p.maxLife;
        const alpha = 1 - t;
        const size = p.size * (1 + treble * 1.5) * (1 - t * 0.4);
        const colorIdx = Math.floor(p.colorMix * theme.colors.length);
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = theme.colors[Math.min(colorIdx, theme.colors.length - 1)];
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, size), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      const coreR = 20 + bassEnvelope * 60;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      coreGrad.addColorStop(0, theme.glow);
      coreGrad.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.5 + bassEnvelope * 0.4;
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    },
  };
}

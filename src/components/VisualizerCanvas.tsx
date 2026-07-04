import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { computeBands } from '../audio/bands';
import type { VisualizerRenderer } from '../visualizers/types';

interface Props {
  analyserRef: RefObject<AnalyserNode | null>;
  renderer: VisualizerRenderer;
}

// Drives the requestAnimationFrame loop: pulls fresh analyser data every frame,
// derives frequency bands, and hands it all to whichever renderer is active.
// analyserRef is a ref (not state) so switching audio sources never restarts this loop.
export function VisualizerCanvas({ analyserRef, renderer }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx2d = canvas?.getContext('2d');
    if (!canvas || !ctx2d) return;

    let freqData = new Uint8Array(0);
    let timeData = new Uint8Array(0);
    let lastTime = performance.now();
    let rafId = 0;

    // Backs the canvas with device pixels (not CSS pixels) for crisp rendering on
    // high-DPI screens, then scales the 2D context so draw calls can keep using CSS units.
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      // Clamp dt so a tab coming back from the background doesn't cause a huge jump.
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const analyser = analyserRef.current;

      // No audio source yet: still draw an empty frame so the renderer's background/idle state shows.
      if (!analyser) {
        renderer.draw(ctx2d, w, h, {
          freq: new Uint8Array(0),
          time: new Uint8Array(0),
          bass: 0,
          mid: 0,
          treble: 0,
          dt,
        });
        return;
      }

      // Buffers are resized lazily to match the analyser, which changes when fftSize changes.
      if (freqData.length !== analyser.frequencyBinCount) {
        freqData = new Uint8Array(analyser.frequencyBinCount);
      }
      if (timeData.length !== analyser.fftSize) {
        timeData = new Uint8Array(analyser.fftSize);
      }
      analyser.getByteFrequencyData(freqData);
      analyser.getByteTimeDomainData(timeData);

      const { bass, mid, treble } = computeBands(freqData, analyser.context.sampleRate);
      renderer.draw(ctx2d, w, h, { freq: freqData, time: timeData, bass, mid, treble, dt });
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [analyserRef, renderer]);

  return <canvas ref={canvasRef} className="block h-full w-full" />;
}

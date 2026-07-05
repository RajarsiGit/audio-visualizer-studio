import { useMemo, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { useAudioEngine } from './audio/useAudioEngine';
import { VisualizerCanvas } from './components/VisualizerCanvas';
import { ControlBar } from './components/ControlBar';
import {
  THEMES,
  createBarsRenderer,
  createParticlesRenderer,
  createWaveformRenderer,
} from './visualizers';

// Composition root: owns UI state (fft size, smoothing, active visualizer/theme,
// fullscreen/drag state), wires useAudioEngine into VisualizerCanvas, and passes
// everything else down to ControlBar.
function App() {
  const [fftSize, setFftSize] = useState(2048);
  const [smoothing, setSmoothing] = useState(0.8);
  const [visualizerId, setVisualizerId] = useState('bars');
  const [themeIndex, setThemeIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  // iOS Safari has no Fullscreen API for arbitrary elements, so hide the control there
  // rather than show a button that silently does nothing.
  const [fullscreenSupported] = useState(() => Boolean(document.fullscreenEnabled));

  const stageRef = useRef<HTMLDivElement | null>(null);

  const engine = useAudioEngine({ fftSize, smoothing });
  const theme = THEMES[themeIndex];

  // Recreated whenever the theme changes so each renderer's draw closure picks up new colors.
  const visualizers = useMemo(
    () => [createBarsRenderer(theme), createWaveformRenderer(theme), createParticlesRenderer(theme)],
    [theme],
  );
  const activeVisualizer = visualizers.find((v) => v.id === visualizerId) ?? visualizers[0];

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    // Ignore non-audio drops (e.g. images) rather than attempting to load them.
    if (file && file.type.startsWith('audio/')) {
      void engine.loadFile(file);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      void stageRef.current?.requestFullscreen();
    } else {
      void document.exitFullscreen();
    }
  };

  return (
    <div
      ref={stageRef}
      className="relative flex h-dvh w-screen flex-col overflow-hidden bg-black text-white"
    >
      <header
        className="pointer-events-none absolute top-0 left-0 z-10 flex w-full items-start justify-between gap-2 bg-gradient-to-b from-black/60 to-transparent p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-4"
      >
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold tracking-wide text-white/90">Audio Visualizer Studio</h1>
          <p className="hidden text-xs text-white/50 sm:block">Bass, mids &amp; treble driving real-time canvas art</p>
        </div>
        {fullscreenSupported && (
          <button
            onClick={toggleFullscreen}
            className="pointer-events-auto shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white backdrop-blur-md hover:bg-white/20"
          >
            ⛶ <span className="hidden sm:inline">Fullscreen</span>
          </button>
        )}
      </header>

      <div
        className="relative flex-1"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <VisualizerCanvas analyserRef={engine.analyserRef} renderer={activeVisualizer} />

        {engine.status === 'idle' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
            <p className="text-center text-sm text-white/40">
              Drop an audio file anywhere, or use the controls below
              <br className="hidden sm:block" />
              to start the microphone.
            </p>
          </div>
        )}

        {isDragging && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center border-4 border-dashed border-white/40 bg-white/5">
            <p className="text-lg font-medium text-white/80">Drop audio file to load</p>
          </div>
        )}

        {engine.error && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 rounded-lg bg-red-500/90 px-4 py-2 text-sm text-white shadow-lg">
            {engine.error}
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-0 flex max-h-full w-full justify-center p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-4">
        <ControlBar
          status={engine.status}
          isPlaying={engine.isPlaying}
          fileName={engine.fileName}
          duration={engine.duration}
          currentTime={engine.currentTime}
          onMic={() => void engine.startMic()}
          onFile={(file) => void engine.loadFile(file)}
          onTogglePlay={engine.togglePlay}
          onSeek={engine.seek}
          onStop={engine.stop}
          visualizers={visualizers}
          visualizerId={activeVisualizer.id}
          onVisualizerChange={setVisualizerId}
          themes={THEMES}
          themeIndex={themeIndex}
          onThemeChange={setThemeIndex}
          fftSize={fftSize}
          onFftSizeChange={setFftSize}
          smoothing={smoothing}
          onSmoothingChange={setSmoothing}
        />
      </div>
    </div>
  );
}

export default App;

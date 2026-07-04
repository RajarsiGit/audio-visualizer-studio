import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import type { SourceKind } from '../audio/useAudioEngine';
import type { Theme, VisualizerRenderer } from '../visualizers/types';

interface Props {
  status: SourceKind;
  isPlaying: boolean;
  fileName: string | null;
  duration: number;
  currentTime: number;
  onMic: () => void;
  onFile: (file: File) => void;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onStop: () => void;
  visualizers: VisualizerRenderer[];
  visualizerId: string;
  onVisualizerChange: (id: string) => void;
  themes: Theme[];
  themeIndex: number;
  onThemeChange: (index: number) => void;
  fftSize: number;
  onFftSizeChange: (size: number) => void;
  smoothing: number;
  onSmoothingChange: (value: number) => void;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ControlBar({
  status,
  isPlaying,
  fileName,
  duration,
  currentTime,
  onMic,
  onFile,
  onTogglePlay,
  onSeek,
  onStop,
  visualizers,
  visualizerId,
  onVisualizerChange,
  themes,
  themeIndex,
  onThemeChange,
  fftSize,
  onFftSizeChange,
  smoothing,
  onSmoothingChange,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = '';
  };

  return (
    <div className="pointer-events-auto flex w-full max-w-5xl flex-col gap-3 rounded-2xl border border-white/10 bg-black/40 p-3 shadow-2xl backdrop-blur-xl sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onMic}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            status === 'mic'
              ? 'bg-white text-black'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          🎙 Microphone
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            status === 'file' ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          📁 Choose File
        </button>
        <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />

        {status !== 'idle' && (
          <button
            onClick={onStop}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-red-500/30"
          >
            ⏹ Stop
          </button>
        )}

        <div className="mx-1 h-6 w-px bg-white/10" />

        {visualizers.map((v) => (
          <button
            key={v.id}
            onClick={() => onVisualizerChange(v.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              visualizerId === v.id ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {v.label}
          </button>
        ))}

        <div className="mx-1 h-6 w-px bg-white/10" />

        <div className="flex items-center gap-2">
          {themes.map((t, i) => (
            <button
              key={t.name}
              title={t.name}
              aria-label={t.name}
              onClick={() => onThemeChange(i)}
              className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-black transition ${
                themeIndex === i ? 'scale-110 ring-2 ring-white' : 'ring-0 hover:scale-105'
              }`}
              style={{ background: `linear-gradient(135deg, ${t.colors.join(', ')})` }}
            />
          ))}
        </div>
      </div>

      {status === 'file' && (
        <div className="flex flex-col gap-1.5">
          <p className="truncate text-xs font-medium text-white/70" title={fileName ?? undefined}>
            {fileName}
          </p>
          <div className="flex items-center gap-3 text-xs text-white/70">
            <button
              onClick={onTogglePlay}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-sm leading-none hover:bg-white/20"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? '⏸' : '▶️'}
            </button>
            <span className="w-10 shrink-0 tabular-nums">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.01}
              value={currentTime}
              onChange={(e) => onSeek(Number(e.target.value))}
              className="h-1 flex-1 accent-white"
            />
            <span className="w-10 shrink-0 text-right tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 border-t border-white/10 pt-3 text-xs text-white/60">
        <label className="flex items-center gap-2">
          <span className="whitespace-nowrap">FFT Size</span>
          <select
            value={fftSize}
            onChange={(e) => onFftSizeChange(Number(e.target.value))}
            className="rounded bg-white/10 px-2 py-1 text-white"
          >
            {[512, 1024, 2048, 4096, 8192].map((n) => (
              <option key={n} value={n} className="bg-neutral-900">
                {n}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-40 flex-1 items-center gap-2">
          <span className="whitespace-nowrap">Smoothing</span>
          <input
            type="range"
            min={0}
            max={0.95}
            step={0.01}
            value={smoothing}
            onChange={(e) => onSmoothingChange(Number(e.target.value))}
            className="h-1 flex-1 accent-white"
          />
          <span className="w-9 text-right tabular-nums">{smoothing.toFixed(2)}</span>
        </label>
      </div>
    </div>
  );
}

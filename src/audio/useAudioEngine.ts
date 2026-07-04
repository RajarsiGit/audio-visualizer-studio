import { useCallback, useEffect, useRef, useState } from 'react';

// Owns the AudioContext and a single shared AnalyserNode, and switches between
// two mutually-exclusive sources (microphone / file playback) by rewiring the
// graph rather than recreating the analyser, so fftSize/smoothing changes and
// the render loop's ref stay stable across source switches.

export type SourceKind = 'idle' | 'mic' | 'file';

interface AudioEngineOptions {
  fftSize: number;
  smoothing: number;
}

export function useAudioEngine({ fftSize, smoothing }: AudioEngineOptions) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const mediaElSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [status, setStatus] = useState<SourceKind>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const el = new Audio();
    el.crossOrigin = 'anonymous';
    audioElRef.current = el;

    const onTime = () => setCurrentTime(el.currentTime);
    const onLoaded = () => setDuration(el.duration || 0);
    const onEnded = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onLoaded);
    el.addEventListener('ended', onEnded);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);

    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onLoaded);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.pause();
      // Release the blob URL and mic tracks so the browser can reclaim the resources.
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      void audioCtxRef.current?.close();
    };
  }, []);

  // Lazily creates the AudioContext/AnalyserNode on first use (browsers require
  // a user gesture before audio can start) and reuses them across source switches.
  const ensureContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (!analyserRef.current) {
      const analyser = audioCtxRef.current.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = smoothing;
      analyserRef.current = analyser;
    }
    return { ctx: audioCtxRef.current, analyser: analyserRef.current };
  }, [fftSize, smoothing]);

  useEffect(() => {
    if (analyserRef.current) analyserRef.current.fftSize = fftSize;
  }, [fftSize]);

  useEffect(() => {
    if (analyserRef.current) analyserRef.current.smoothingTimeConstant = smoothing;
  }, [smoothing]);

  const stopMicTracks = () => {
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    micSourceRef.current?.disconnect();
    micSourceRef.current = null;
  };

  const startMic = useCallback(async () => {
    setError(null);
    try {
      const { ctx, analyser } = ensureContext();
      await ctx.resume();
      audioElRef.current?.pause();
      stopMicTracks();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const source = ctx.createMediaStreamSource(stream);
      micSourceRef.current = source;

      // Disconnect any previous downstream routing (e.g. file -> destination),
      // then tap the mic into the analyser WITHOUT routing to destination —
      // connecting mic audio to output would cause feedback howl.
      analyser.disconnect();
      source.connect(analyser);

      setStatus('mic');
      setFileName(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone access failed');
    }
  }, [ensureContext]);

  const loadFile = useCallback(
    async (file: File) => {
      setError(null);
      try {
        const { ctx, analyser } = ensureContext();
        await ctx.resume();
        stopMicTracks();

        const el = audioElRef.current;
        if (!el) return;
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        const url = URL.createObjectURL(file);
        objectUrlRef.current = url;
        el.src = url;

        // createMediaElementSource can only be called once per <audio> element,
        // so the source node is created once and reused across file loads.
        if (!mediaElSourceRef.current) {
          const source = ctx.createMediaElementSource(el);
          mediaElSourceRef.current = source;
          source.connect(analyser);
        }
        // Unlike mic input, file playback routes to destination so it's audible.
        analyser.disconnect();
        analyser.connect(ctx.destination);

        setFileName(file.name);
        setStatus('file');
        await el.play();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load audio file');
      }
    },
    [ensureContext],
  );

  const togglePlay = useCallback(() => {
    const el = audioElRef.current;
    if (!el || status !== 'file') return;
    if (el.paused) {
      void audioCtxRef.current?.resume();
      void el.play();
    } else {
      el.pause();
    }
  }, [status]);

  const stop = useCallback(() => {
    const el = audioElRef.current;
    if (status === 'file' && el) {
      el.pause();
      el.currentTime = 0;
    }
    if (status === 'mic') stopMicTracks();
    setStatus('idle');
    setFileName(null);
  }, [status]);

  const seek = useCallback((time: number) => {
    const el = audioElRef.current;
    if (el) el.currentTime = time;
  }, []);

  return {
    status,
    isPlaying,
    fileName,
    error,
    duration,
    currentTime,
    analyserRef,
    startMic,
    loadFile,
    togglePlay,
    stop,
    seek,
  };
}

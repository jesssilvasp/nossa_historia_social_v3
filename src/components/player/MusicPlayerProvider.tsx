"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type PlayerTrack = {
  id: number;
  title: string;
  artist: string;
  url: string;
  coverUrl?: string | null;
};

type PlayerValue = {
  track: PlayerTrack | null;
  playing: boolean;
  progress: number;
  duration: number;
  play: (track: PlayerTrack) => void;
  toggle: () => void;
  stop: () => void;
};

const PlayerContext = createContext<PlayerValue | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer precisa estar dentro de MusicPlayerProvider");
  return ctx;
}

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [track, setTrack] = useState<PlayerTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;
    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onEnd = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  const play = useCallback((next: PlayerTrack) => {
    const audio = audioRef.current;
    if (!audio) return;
    setTrack((prev) => {
      if (prev?.id === next.id && prev.url === next.url) {
        void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
        return prev;
      }
      audio.src = next.url;
      audio.currentTime = 0;
      void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      return next;
    });
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }, [playing, track]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setPlaying(false);
    setProgress(0);
  }, []);

  const value = useMemo(
    () => ({ track, playing, progress, duration, play, toggle, stop }),
    [track, playing, progress, duration, play, toggle, stop],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

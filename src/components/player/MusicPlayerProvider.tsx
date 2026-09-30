"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getEmbedSource, isEmbeddedMusicUrl } from "./MusicEmbed";

export type PlayerTrack = {
  id: number | string;
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
  volume: number;
  error: string;
  play: (track: PlayerTrack) => void;
  toggle: () => void;
  stop: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
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
  const [volume, setVolumeState] = useState(80);
  const [youtubeApiReady, setYoutubeApiReady] = useState(false);
  const [spotifyApiReady, setSpotifyApiReady] = useState(false);
  const [error, setError] = useState("");
  const volumeRef = useRef(80);
  const youtubeRef = useRef<{ loadVideoById: (id: string) => void; playVideo: () => void; pauseVideo: () => void; stopVideo: () => void; seekTo: (seconds: number, allowSeekAhead: boolean) => void; setVolume: (volume: number) => void; getCurrentTime: () => number; getDuration: () => number; destroy: () => void } | null>(null);
  const youtubePlayableRef = useRef(false);
  const trackRef = useRef<PlayerTrack | null>(null);
  const spotifyRef = useRef<{ play: () => void; pause: () => void; resume: () => void; seek: (position: number) => void; restart: () => void; loadEntity: (uri: string) => void; addListener: (event: string, callback: (event: { data?: { position: number; duration: number; isPaused?: boolean } }) => void) => void } | null>(null);
  const spotifyApiRef = useRef<{ createController: (element: HTMLElement, options: object, callback: (controller: NonNullable<typeof spotifyRef.current>) => void) => void } | null>(null);
  const pendingPlayRef = useRef(false);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.volume = volumeRef.current / 100;
    audioRef.current = audio;
    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onEnd = () => setPlaying(false);
    const onError = () => {
      console.error("Falha ao carregar áudio:", audio.error, audio.src);
      setPlaying(false);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("error", onError);
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("error", onError);
    };
  }, []);

  const play = useCallback((next: PlayerTrack) => {
    const audio = audioRef.current;
    if (!audio) return;
    trackRef.current = next;
    if (isEmbeddedMusicUrl(next.url)) {
      audio.pause();
      setPlaying(false);
      setProgress(0);
      setDuration(0);
      setError("");
      const source = getEmbedSource(next.url);
      pendingPlayRef.current = true;
      if (source?.provider === "youtube" && youtubePlayableRef.current && typeof youtubeRef.current?.loadVideoById === "function") {
        youtubeRef.current.loadVideoById(source.id);
        youtubeRef.current.playVideo();
        pendingPlayRef.current = false;
      }
      if (source?.provider === "spotify" && spotifyRef.current) {
        spotifyRef.current.loadEntity(`spotify:${source.type}:${source.id}`);
        spotifyRef.current.play();
        pendingPlayRef.current = false;
      }
      setTrack(next);
      return;
    }
    setTrack((prev) => {
      if (prev?.id === next.id && prev.url === next.url) {
        void audio.play().then(() => setPlaying(true)).catch((error) => {
          console.error("Falha ao tocar áudio:", error, next.url);
          setPlaying(false);
        });
        return prev;
      }
      audio.src = next.url;
      audio.currentTime = 0;
      void audio.play().then(() => setPlaying(true)).catch((error) => {
        console.error("Falha ao tocar áudio:", error, next.url);
        setPlaying(false);
      });
      return next;
    });
  }, []);

  const seek = useCallback((seconds: number) => {
    if (!track) return;
    const source = getEmbedSource(track.url);
    if (source?.provider === "youtube" && youtubePlayableRef.current) youtubeRef.current?.seekTo(seconds, true);
    else if (source?.provider === "spotify") setError("Use a barra de progresso do player oficial do Spotify.");
    else if (audioRef.current) audioRef.current.currentTime = seconds;
    if (source?.provider !== "spotify") setProgress(seconds);
  }, [track]);

  const setVolume = useCallback((nextVolume: number) => {
    const safeVolume = Math.max(0, Math.min(100, Math.round(nextVolume)));
    volumeRef.current = safeVolume;
    setVolumeState(safeVolume);
    if (audioRef.current) audioRef.current.volume = safeVolume / 100;
    if (youtubePlayableRef.current) youtubeRef.current?.setVolume(safeVolume);
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (isEmbeddedMusicUrl(track.url)) {
      const source = getEmbedSource(track.url);
      if (source?.provider === "youtube" && youtubePlayableRef.current && youtubeRef.current) {
        if (playing) youtubeRef.current.pauseVideo(); else youtubeRef.current.playVideo();
      } else if (source?.provider === "spotify") {
        if (playing) spotifyRef.current?.pause();
        else spotifyRef.current?.resume();
      }
      return;
    }
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
    const source = track ? getEmbedSource(track.url) : null;
    if (source?.provider === "youtube" && youtubePlayableRef.current) youtubeRef.current?.stopVideo();
    if (source?.provider === "spotify") {
      spotifyRef.current?.pause();
      spotifyRef.current?.restart();
    }
  }, [track]);

  const onYoutubeReady = useCallback((event: { target: typeof youtubeRef.current }) => {
    const player = event.target;
    if (!player || typeof player.loadVideoById !== "function") return;
    youtubeRef.current = player;
    youtubePlayableRef.current = true;
    player.setVolume(volumeRef.current);
    setYoutubeApiReady(true);
    const source = trackRef.current ? getEmbedSource(trackRef.current.url) : null;
    if (source?.provider === "youtube") {
      player.loadVideoById(source.id);
      if (pendingPlayRef.current) player.playVideo();
      pendingPlayRef.current = false;
    }
  }, []);

  const onYoutubeState = useCallback((event: { data: number; target: typeof youtubeRef.current }) => {
    const player = event.target;
    if (!player) return;
    setPlaying(event.data === 1);
    if (event.data === 1 || event.data === 2) {
      setProgress(player.getCurrentTime());
      setDuration(player.getDuration());
    }
    if (event.data === 0) { setProgress(0); setPlaying(false); }
  }, []);

  const onYoutubeError = useCallback(() => { setError("Este vídeo não permite reprodução incorporada. Tente outro link do YouTube."); setPlaying(false); }, []);

  useEffect(() => {
    if (!track || typeof window === "undefined") return;
    const source = getEmbedSource(track.url);
    if (source?.provider !== "youtube" || !youtubeApiReady || youtubeRef.current) return;
    const YT = (window as Window & { YT?: { Player: new (id: string, options: object) => NonNullable<typeof youtubeRef.current> } }).YT;
    if (!YT) return;
    youtubePlayableRef.current = false;
    youtubeRef.current = new YT.Player("global-youtube-player", {
      width: "100%", height: "200", videoId: source.id,
      playerVars: { playsinline: 1, rel: 0, origin: window.location.origin },
      events: { onReady: onYoutubeReady, onStateChange: onYoutubeState, onError: onYoutubeError },
    });
  }, [track, youtubeApiReady, onYoutubeReady, onYoutubeState, onYoutubeError]);

  useEffect(() => {
    const source = track ? getEmbedSource(track.url) : null;
    if (source?.provider !== "youtube" || !youtubePlayableRef.current || !youtubeRef.current) return;
    youtubeRef.current.loadVideoById(source.id);
    if (pendingPlayRef.current) youtubeRef.current.playVideo();
    pendingPlayRef.current = false;
  }, [track]);

  useEffect(() => {
    if (!track) return;
    const source = getEmbedSource(track.url);
    if (source?.provider !== "spotify") { spotifyRef.current = null; return; }
    const api = spotifyApiRef.current;
    const frame = document.getElementById("global-spotify-player");
    if (!spotifyApiReady || !api || !frame) return;
    if (spotifyRef.current) { spotifyRef.current = null; frame.replaceChildren(); }
    api.createController(frame, { uri: `spotify:${source.type}:${source.id}`, width: "100%", height: 80 }, (controller) => {
      spotifyRef.current = controller;
      controller.addListener("playback_update", (event) => {
        if (!event.data) return;
        setProgress(event.data.position / 1000);
        setDuration(event.data.duration / 1000);
        setPlaying(!event.data.isPaused);
      });
      if (pendingPlayRef.current) controller.play();
      pendingPlayRef.current = false;
    });
  }, [track, spotifyApiReady]);

  const value = useMemo(
    () => ({ track, playing, progress, duration, volume, error, play, toggle, stop, seek, setVolume }),
    [track, playing, progress, duration, volume, error, play, toggle, stop, seek, setVolume],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      const source = track ? getEmbedSource(track.url) : null;
      if (source?.provider === "youtube" && youtubePlayableRef.current && youtubeRef.current) {
        setProgress(youtubeRef.current.getCurrentTime() || 0);
        setDuration(youtubeRef.current.getDuration() || 0);
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [track]);

  useEffect(() => {
    let active = true;
    const apiWindow = window as Window & {
      onSpotifyIframeApiReady?: (api: NonNullable<typeof spotifyApiRef.current>) => void;
      SpotifyIframeApi?: NonNullable<typeof spotifyApiRef.current>;
      onYouTubeIframeAPIReady?: () => void;
      YT?: { Player: new (id: string, options: object) => NonNullable<typeof youtubeRef.current> };
    };

    apiWindow.onSpotifyIframeApiReady = (api) => {
      spotifyApiRef.current = api;
      if (active) setSpotifyApiReady(true);
    };
    if (apiWindow.SpotifyIframeApi) apiWindow.onSpotifyIframeApiReady(apiWindow.SpotifyIframeApi);
    else if (!document.querySelector('script[data-music-api="spotify"]')) {
      const script = document.createElement("script");
      script.src = "https://open.spotify.com/embed/iframe-api/v1";
      script.async = true;
      script.dataset.musicApi = "spotify";
      script.onerror = () => setError("Não foi possível carregar o player do Spotify. Recarregue a página e tente de novo.");
      document.head.appendChild(script);
    }

    apiWindow.onYouTubeIframeAPIReady = () => { if (active) setYoutubeApiReady(true); };
    if (apiWindow.YT?.Player) window.setTimeout(() => { if (active) setYoutubeApiReady(true); }, 0);
    else if (!document.querySelector('script[data-music-api="youtube"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.dataset.musicApi = "youtube";
      script.onerror = () => setError("Não foi possível carregar o player do YouTube. Recarregue a página e tente de novo.");
      document.head.appendChild(script);
    }
    return () => { active = false; };
  }, []);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

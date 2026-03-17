import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic } from 'lucide-react';
import { clsx } from 'clsx';

interface VoicePlayerProps {
  url: string;
  isMe: boolean;
}

const VoicePlayer: React.FC<VoicePlayerProps> = ({ url, isMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [waveformBars] = useState(() => 
    Array.from({ length: 22 }, () => Math.random() * 0.8 + 0.2)
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      // Fix for Infinity duration in some browsers (especially with WebM)
      if (audio.duration === Infinity) {
        audio.currentTime = 1e101;
        audio.ontimeupdate = () => {
          audio.ontimeupdate = null;
          setDuration(audio.duration);
          audio.currentTime = 0;
        };
      } else {
        setDuration(audio.duration);
      }
      setIsLoading(false);
    };

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const onError = () => {
      console.error('[VoicePlayer] Audio error:', audio.error);
      setIsError(true);
      setIsLoading(false);
    };

    const onCanPlay = () => setIsLoading(false);

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('canplay', onCanPlay);

    // Initial load check
    if (audio.readyState >= 2) setIsLoading(false);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('canplay', onCanPlay);
    };
  }, [url]);

  const togglePlay = () => {
    if (!audioRef.current || isError) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error('[VoicePlayer] Playback failed:', err);
        setIsError(true);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleSpeedToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rates = [1, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) : 0;

  return (
    <div className={clsx(
      "flex items-center gap-1.5 py-0.5 px-0.5 rounded-2xl transition-all duration-300",
      "w-full max-w-[220px]"
    )}>
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        disabled={isLoading || isError}
        className={clsx(
          "w-6 h-6 flex items-center justify-center rounded-full shrink-0 transition-transform active:scale-95 disabled:opacity-50",
          isMe ? "bg-white text-sky-500" : "bg-sky-500 text-white shadow-md shadow-sky-200/50"
        )}
      >
        {isError ? (
          <span className="text-[8px] font-bold">!</span>
        ) : isPlaying ? (
          <Pause className="w-2.5 h-2.5" />
        ) : (
          <Play className="w-2.5 h-2.5 ml-0.5" />
        )}
      </button>

      {/* Waveform and Progress */}
      <div className="flex-1 min-w-0 flex flex-col gap-0">
        <div className="flex items-center gap-[1.5px] h-4 px-1">
          {waveformBars.map((height, i) => {
            const barProgress = i / waveformBars.length;
            const isActive = progress > barProgress;
            return (
              <div
                key={i}
                className={clsx(
                  "flex-1 rounded-full transition-all duration-300 waveform-bar-dynamic",
                  isActive 
                    ? (isMe ? "bg-white" : "bg-sky-500") 
                    : (isMe ? "bg-white/30" : "bg-slate-200")
                )}
                style={{ '--bar-height': `${height * 100}%` } as React.CSSProperties}
              />
            );
          })}
        </div>
        <div className={clsx(
          "flex justify-between items-center text-[9px] font-bold tracking-tight uppercase px-0.5",
          isMe ? "text-white/70" : "text-slate-400"
        )}>
          <span>{isError ? 'Error' : formatTime(currentTime)}</span>
          <span>{isLoading ? '...' : formatTime(duration)}</span>
        </div>
      </div>

      {/* Playback Speed */}
      <button
        onClick={handleSpeedToggle}
        className={clsx(
          "px-1 py-0.5 rounded-lg text-[8px] font-black transition-all active:scale-95 shrink-0",
          isMe 
            ? "bg-white/20 text-white hover:bg-white/30" 
            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
        )}
      >
        {playbackRate}x
      </button>

      <audio ref={audioRef} src={url} className="hidden" />
    </div>
  );
};

export default VoicePlayer;

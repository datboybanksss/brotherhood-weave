import { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

function formatDur(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s) % 60).padStart(2, "0")}`;
}

export default function VoiceMessageBubble({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.pause();
    else a.play().catch(() => {});
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * a.duration;
  };

  return (
    <div className="flex items-center gap-2.5 w-52 py-0.5">
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0); setCurrentTime(0); }}
        onTimeUpdate={() => {
          const a = audioRef.current;
          if (!a) return;
          setCurrentTime(a.currentTime);
          if (a.duration && isFinite(a.duration))
            setProgress((a.currentTime / a.duration) * 100);
        }}
        onLoadedMetadata={() => {
          const a = audioRef.current;
          if (a && isFinite(a.duration)) setDuration(a.duration);
        }}
      />
      <button
        onClick={toggle}
        className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing
          ? <Pause className="h-3.5 w-3.5" />
          : <Play className="h-3.5 w-3.5 ml-0.5" />}
      </button>
      <div className="flex-1 space-y-1.5">
        <div
          className="h-1.5 bg-muted rounded-full overflow-hidden cursor-pointer"
          onClick={seek}
        >
          <div
            className="h-full bg-primary rounded-full"
            style={{ width: `${progress}%`, transition: playing ? "width 0.25s linear" : "width 0.15s ease-out" }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground tabular-nums">
          {formatDur(playing ? Math.floor(currentTime) : Math.floor(duration))}
        </p>
      </div>
    </div>
  );
}

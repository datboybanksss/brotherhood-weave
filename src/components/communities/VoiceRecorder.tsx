import { useRef, useState, useEffect } from "react";
import { Mic, X, Send, Pause, Play, Trash2, Square } from "lucide-react";
import { toast } from "sonner";

type State = "idle" | "recording" | "paused" | "review" | "sending";

function formatDur(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s) % 60).padStart(2, "0")}`;
}

const BAR_COUNT = 22;
const FLAT_BARS = Array<number>(BAR_COUNT).fill(0.12);

interface Props {
  onRecorded: (blob: Blob, mimeType: string) => Promise<void>;
  onRecordingChange: (isRecording: boolean) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({ onRecorded, onRecordingChange, disabled }: Props) {
  const [state, setState] = useState<State>("idle");
  const [seconds, setSeconds] = useState(0);
  const [bars, setBars] = useState<number[]>(FLAT_BARS);
  const [reviewProgress, setReviewProgress] = useState(0);
  const [reviewCurrentTime, setReviewCurrentTime] = useState(0);
  const [reviewDuration, setReviewDuration] = useState(0);
  const [reviewPlaying, setReviewPlaying] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const secondsRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mimeTypeRef = useRef("audio/webm");
  const reviewBlobRef = useRef<Blob | null>(null);
  const reviewUrlRef = useRef<string | null>(null);
  const reviewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      audioCtxRef.current?.close();
      const r = recorderRef.current;
      if (r && r.state !== "inactive") { r.onstop = null; if (r.state === "paused") r.resume(); r.stop(); }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      reviewAudioRef.current?.pause();
      if (reviewUrlRef.current) URL.revokeObjectURL(reviewUrlRef.current);
    };
  }, []);

  const animateBars = (analyser: AnalyserNode) => {
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      setBars(
        Array.from({ length: BAR_COUNT }, (_, i) => {
          const idx = Math.floor((i / BAR_COUNT) * (data.length * 0.55));
          return Math.max(0.1, data[idx] / 255);
        })
      );
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  };

  const stopBarsAnimation = () => {
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    setBars(FLAT_BARS);
  };

  const startRecording = async () => {
    if (disabled) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      mimeTypeRef.current = mimeType;

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorderRef.current = recorder;
      secondsRef.current = 0;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(100);

      setState("recording");
      setSeconds(0);
      onRecordingChange(true);

      timerRef.current = setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
        if (secondsRef.current >= 120) stopToReview();
      }, 1000);

      animateBars(analyser);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const pauseRecording = () => {
    const r = recorderRef.current;
    if (!r || r.state !== "recording") return;
    r.pause();
    if (timerRef.current) clearInterval(timerRef.current);
    stopBarsAnimation();
    setState("paused");
  };

  const resumeRecording = () => {
    const r = recorderRef.current;
    if (!r || r.state !== "paused") return;
    r.resume();
    setState("recording");
    timerRef.current = setInterval(() => {
      secondsRef.current += 1;
      setSeconds(secondsRef.current);
      if (secondsRef.current >= 120) stopToReview();
    }, 1000);
    if (analyserRef.current) animateBars(analyserRef.current);
  };

  const stopMedia = (): Promise<Blob> =>
    new Promise((resolve) => {
      const r = recorderRef.current;
      if (!r || r.state === "inactive") { resolve(new Blob()); return; }
      const mime = r.mimeType;
      r.onstop = () => {
        resolve(new Blob(chunksRef.current, { type: mime }));
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      if (r.state === "paused") r.resume();
      r.stop();
    });

  const stopToReview = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopBarsAnimation();
    audioCtxRef.current?.close();
    audioCtxRef.current = null;

    const blob = await stopMedia();
    onRecordingChange(false);

    if (blob.size < 100) { resetAll(); return; }

    reviewBlobRef.current = blob;
    if (reviewUrlRef.current) URL.revokeObjectURL(reviewUrlRef.current);
    const url = URL.createObjectURL(blob);
    reviewUrlRef.current = url;

    const audio = new Audio(url);
    reviewAudioRef.current = audio;
    audio.onloadedmetadata = () => { if (isFinite(audio.duration)) setReviewDuration(audio.duration); };
    audio.ontimeupdate = () => {
      if (!audio.duration || !isFinite(audio.duration)) return;
      setReviewCurrentTime(audio.currentTime);
      setReviewProgress((audio.currentTime / audio.duration) * 100);
    };
    audio.onended = () => { setReviewPlaying(false); setReviewProgress(0); setReviewCurrentTime(0); };
    audio.load();

    setState("review");
    setReviewPlaying(false);
    setReviewProgress(0);
    setReviewCurrentTime(0);
    setReviewDuration(0);
  };

  const toggleReviewPlayback = () => {
    const audio = reviewAudioRef.current;
    if (!audio) return;
    if (reviewPlaying) { audio.pause(); setReviewPlaying(false); }
    else { audio.play().catch(() => {}); setReviewPlaying(true); }
  };

  const seekReview = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = reviewAudioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
  };

  const sendReview = async () => {
    const blob = reviewBlobRef.current;
    if (!blob) return;
    reviewAudioRef.current?.pause();
    setState("sending");
    try {
      await onRecorded(blob, mimeTypeRef.current);
      cleanupReview();
      resetAll();
    } catch {
      toast.error("Failed to send voice note");
      setState("review");
    }
  };

  const discardReview = () => {
    cleanupReview();
    resetAll();
  };

  const cleanupReview = () => {
    reviewAudioRef.current?.pause();
    reviewAudioRef.current = null;
    if (reviewUrlRef.current) { URL.revokeObjectURL(reviewUrlRef.current); reviewUrlRef.current = null; }
    reviewBlobRef.current = null;
  };

  const cancelRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopBarsAnimation();
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    const r = recorderRef.current;
    if (r && r.state !== "inactive") { r.onstop = null; if (r.state === "paused") r.resume(); r.stop(); }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    onRecordingChange(false);
    resetAll();
  };

  const resetAll = () => {
    setState("idle");
    setSeconds(0);
    secondsRef.current = 0;
    setBars(FLAT_BARS);
    setReviewProgress(0);
    setReviewCurrentTime(0);
    setReviewDuration(0);
    setReviewPlaying(false);
    recorderRef.current = null;
    chunksRef.current = [];
  };

  // ── idle ──────────────────────────────────────────────────────────────────
  if (state === "idle") {
    return (
      <button
        type="button"
        onClick={startRecording}
        disabled={disabled}
        className="p-2 rounded-full hover:bg-accent text-muted-foreground disabled:opacity-40 shrink-0"
        aria-label="Record voice note"
      >
        <Mic className="h-5 w-5" />
      </button>
    );
  }

  // ── review / sending ──────────────────────────────────────────────────────
  if (state === "review" || state === "sending") {
    const busy = state === "sending";
    const timeLabel = reviewPlaying
      ? formatDur(Math.floor(reviewCurrentTime))
      : formatDur(Math.floor(reviewDuration));

    return (
      <div className="flex items-center gap-2 flex-1 bg-muted rounded-lg px-3 py-2">
        <button
          type="button"
          onClick={discardReview}
          disabled={busy}
          className="text-destructive/70 hover:text-destructive shrink-0 disabled:opacity-40 transition-colors"
          aria-label="Delete recording"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={toggleReviewPlayback}
          disabled={busy}
          className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40"
          aria-label={reviewPlaying ? "Pause preview" : "Play preview"}
        >
          {reviewPlaying
            ? <Pause className="h-3 w-3" />
            : <Play className="h-3 w-3 ml-[1px]" />}
        </button>
        <div className="flex-1 space-y-1 min-w-0">
          <div
            className="h-1.5 bg-background rounded-full overflow-hidden cursor-pointer"
            onClick={seekReview}
          >
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${reviewProgress}%`, transition: "width 0.1s linear" }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground tabular-nums">{timeLabel}</p>
        </div>
        <button
          type="button"
          onClick={sendReview}
          disabled={busy}
          className="p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-50 shrink-0"
          aria-label="Send voice note"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // ── recording / paused ────────────────────────────────────────────────────
  const isPaused = state === "paused";
  return (
    <div className="flex items-center gap-2 flex-1 bg-muted rounded-lg px-3 py-2">
      <button
        type="button"
        onClick={cancelRecording}
        className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
        aria-label="Cancel recording"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* live waveform */}
        <div className="flex items-center gap-[2px] flex-1 h-7">
          {bars.map((v, i) => (
            <div
              key={i}
              className={`flex-none rounded-full transition-all duration-75 ${
                isPaused ? "bg-muted-foreground/40" : "bg-primary"
              }`}
              style={{ width: "3px", height: `${Math.max(8, Math.round(v * 100))}%` }}
            />
          ))}
        </div>
        <span
          className={`text-sm font-mono tabular-nums shrink-0 ${
            isPaused ? "text-muted-foreground" : "text-foreground"
          }`}
        >
          {formatDur(seconds)}
        </span>
      </div>
      {/* pause / resume */}
      <button
        type="button"
        onClick={isPaused ? resumeRecording : pauseRecording}
        className="w-7 h-7 rounded-full border border-border flex items-center justify-center shrink-0 text-foreground hover:bg-accent transition-colors"
        aria-label={isPaused ? "Resume recording" : "Pause recording"}
      >
        {isPaused
          ? <Play className="h-3 w-3 ml-[1px]" />
          : <Pause className="h-3 w-3" />}
      </button>
      {/* stop → review */}
      <button
        type="button"
        onClick={stopToReview}
        disabled={seconds < 1}
        className="p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-40 shrink-0"
        aria-label="Stop and review"
      >
        <Square className="h-4 w-4 fill-current" />
      </button>
    </div>
  );
}

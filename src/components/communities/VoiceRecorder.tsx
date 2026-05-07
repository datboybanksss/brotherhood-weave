import { useRef, useState } from "react";
import { Mic, X, Send } from "lucide-react";
import { toast } from "sonner";

function formatDur(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

interface Props {
  onRecorded: (blob: Blob, mimeType: string) => Promise<void>;
  onRecordingChange: (isRecording: boolean) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({ onRecorded, onRecordingChange, disabled }: Props) {
  const [state, setState] = useState<"idle" | "recording" | "sending">("idle");
  const [seconds, setSeconds] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const secondsRef = useRef(0);

  const startRecording = async () => {
    if (disabled) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorderRef.current = recorder;
      secondsRef.current = 0;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(100);
      setState("recording");
      setSeconds(0);
      onRecordingChange(true);

      timerRef.current = setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
        if (secondsRef.current >= 120) stopAndSend();
      }, 1000);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopMedia = (): Promise<{ blob: Blob; mimeType: string }> =>
    new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve({ blob: new Blob(), mimeType: "audio/webm" });
        return;
      }
      const mimeType = recorder.mimeType;
      recorder.onstop = () => {
        resolve({ blob: new Blob(chunksRef.current, { type: mimeType }), mimeType });
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };
      recorder.stop();
    });

  const stopAndSend = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setState("sending");
    const { blob, mimeType } = await stopMedia();
    onRecordingChange(false);
    try {
      await onRecorded(blob, mimeType);
    } catch {
      toast.error("Failed to send voice note");
    }
    setState("idle");
    setSeconds(0);
    secondsRef.current = 0;
  };

  const cancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    chunksRef.current = [];
    recorderRef.current = null;
    setState("idle");
    setSeconds(0);
    secondsRef.current = 0;
    onRecordingChange(false);
  };

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

  return (
    <div className="flex items-center gap-2 flex-1 bg-muted rounded-lg px-3 py-2">
      <button
        type="button"
        onClick={cancel}
        className="text-muted-foreground shrink-0"
        aria-label="Cancel recording"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span
          className={`w-2 h-2 rounded-full bg-red-500 shrink-0 ${
            state === "recording" ? "animate-pulse" : "opacity-50"
          }`}
        />
        <span className="text-sm font-mono tabular-nums text-foreground">
          {formatDur(seconds)}
        </span>
        <span className="text-xs text-muted-foreground">
          {state === "sending" ? "Sending…" : "Recording"}
        </span>
      </div>
      <button
        type="button"
        onClick={stopAndSend}
        disabled={state === "sending" || seconds < 1}
        className="p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-40 shrink-0"
        aria-label="Send voice note"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}

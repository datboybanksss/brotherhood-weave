import { Trophy } from "lucide-react";
import stravaLogo from "@/assets/strava-logo.png";

interface Props {
  value: number;
  max: number;
  label?: string;
  sublabel?: string;
}

export default function CircularProgress({ value, max, label, sublabel }: Props) {
  const size = 180;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const done = value >= max;
  const arcColor = done ? "#1A7F5A" : "#1512D3";
  const trackColor = "#9CA3AF";
  const display = done ? `${max} / ${max} km` : `${value.toFixed(1)} / ${max} km`;
  const sub = done ? "done." : sublabel ?? "by June 16";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" opacity={0.3} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={arcColor} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
        <div className="font-mono text-[20px] font-semibold leading-tight">{label ?? display}</div>
        <div className="text-xs text-muted-foreground mt-1">{sub}</div>
        {done && <Trophy className="w-5 h-5 mt-2 text-[#1A7F5A]" />}
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
          <img src={stravaLogo} alt="Strava" className="w-3 h-3" />
          <span>Powered by Strava</span>
        </div>
      </div>
    </div>
  );
}

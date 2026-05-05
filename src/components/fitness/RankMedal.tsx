import medal1 from "@/assets/medal-1st.png";
import medal2 from "@/assets/medal-2nd.png";
import medal3 from "@/assets/medal-3rd.png";

export function medalForRank(rank: number): string | null {
  if (rank === 1) return medal1;
  if (rank === 2) return medal2;
  if (rank === 3) return medal3;
  return null;
}

export default function RankMedal({ rank, className = "h-5 w-5" }: { rank: number; className?: string }) {
  const src = medalForRank(rank);
  if (!src) return null;
  return <img src={src} alt={`${rank} place medal`} className={`${className} object-contain inline-block`} />;
}
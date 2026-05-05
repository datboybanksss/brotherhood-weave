import stravaLogo from "@/assets/strava-logo.png";

export default function PoweredByStrava() {
  return (
    <a href="https://www.strava.com" target="_blank" rel="noopener noreferrer"
       className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground hover:text-foreground">
      <img src={stravaLogo} alt="Strava" className="w-4 h-4" />
      Powered by Strava
    </a>
  );
}

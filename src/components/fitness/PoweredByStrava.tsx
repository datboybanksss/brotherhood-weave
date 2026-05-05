export default function PoweredByStrava() {
  return (
    <a href="https://www.strava.com" target="_blank" rel="noopener noreferrer"
       className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground hover:text-foreground">
      <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "hsl(24 95% 53%)" }} aria-hidden />
      Powered by Strava
    </a>
  );
}

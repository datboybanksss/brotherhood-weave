export default function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="relative flex items-center py-1">
      <div className="flex-grow border-t border-border" />
      <span className="mx-3 text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex-grow border-t border-border" />
    </div>
  );
}
import Avatar from "@/components/Avatar";
import { Button } from "@/components/ui/button";

interface ProfileCardProps {
  userId: string;
  name: string;
  title: string;
  contactText: string;
  onContactClick: () => void;
}

export default function ProfileCard({ userId, name, title, contactText, onContactClick }: ProfileCardProps) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-card-foreground">
      <Avatar userId={userId} size="xl" />
      <div className="text-center">
        <h3 className="font-semibold">{name}</h3>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
      <Button variant="outline" onClick={onContactClick}>{contactText}</Button>
    </div>
  );
}

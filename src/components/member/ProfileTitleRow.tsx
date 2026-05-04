export default function ProfileTitleRow({ title }: { title: string | null }) {
  if (!title) return null;
  return <p className="text-sm font-semibold text-foreground">{title}</p>;
}
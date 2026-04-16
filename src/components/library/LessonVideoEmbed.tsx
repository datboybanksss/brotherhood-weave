function toEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vim = url.match(/vimeo\.com\/(\d+)/);
  if (vim) return `https://player.vimeo.com/video/${vim[1]}`;
  return null;
}

export default function LessonVideoEmbed({ url }: { url: string }) {
  const embedUrl = toEmbedUrl(url);
  if (!embedUrl) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
        Video unavailable
      </div>
    );
  }
  return (
    <iframe
      className="aspect-video w-full rounded-lg"
      src={embedUrl}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}

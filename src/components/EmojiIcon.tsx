const BASE = "https://cdnjs.cloudflare.com/ajax/libs/emoji-datasource-apple/16.0.0/img/apple/64/";

interface Props {
  cp: string;
  alt: string;
  size?: number;
  className?: string;
}

export default function EmojiIcon({ cp, alt, size = 20, className = "" }: Props) {
  return (
    <img
      src={`${BASE}${cp}.png`}
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      className={`inline-block shrink-0 object-contain select-none ${className}`}
    />
  );
}

const EMOJIS = ["👍", "❤️", "🔥", "😂", "🙏", "💯", "👏", "🤝"];

export default function EmojiPicker({ onPick }: { onPick: (e: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 p-2">
      {EMOJIS.map((e) => (
        <button
          key={e}
          onClick={() => onPick(e)}
          className="text-2xl h-10 w-10 rounded-md hover:bg-accent flex items-center justify-center"
        >
          {e}
        </button>
      ))}
    </div>
  );
}
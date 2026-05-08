import merchGraphic from "@/assets/buy-merchandise.gif";

export default function BuyMerchandiseCard() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-center">
      <img
        src={merchGraphic}
        alt=""
        className="h-20 w-auto object-contain"
        loading="lazy"
      />
      <div className="text-label text-foreground font-sans font-bold text-sm">Money Manual</div>
    </div>
  );
}


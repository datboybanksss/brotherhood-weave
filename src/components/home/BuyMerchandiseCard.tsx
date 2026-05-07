import merchGraphic from "@/assets/buy-merchandise.gif";

export default function BuyMerchandiseCard() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <img
          src={merchGraphic}
          alt=""
          className="h-5 w-5 sm:h-6 sm:w-6 object-contain"
          loading="lazy"
        />{" "}
        Marketing & Merchandise
      </div>
    </div>
  );
}


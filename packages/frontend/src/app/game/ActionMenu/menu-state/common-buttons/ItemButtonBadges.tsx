import { MaxAndCurrent } from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import { PriceDisplay } from "@/app/game/character-sheet/ShardsDisplay";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client-consts";

interface Props {
  showEquippedStatus?: boolean;
  durability?: MaxAndCurrent | null;
  price?: number | null;
  shardsOwned?: number | null;
}

export const ItemButtonBadges = observer((props: Props) => {
  const { showEquippedStatus, durability, price, shardsOwned } = props;

  if (!showEquippedStatus && !durability && price === undefined) {
    return null;
  }

  return (
    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex">
      {showEquippedStatus && (
        <div className="w-fit flex pr-2 pl-2 h-8 items-center bg-slate-700 border border-slate-400 mr-1">
          EQUIPPED
        </div>
      )}
      {durability && (
        <div
          className={`w-fit flex pr-2 pl-2 h-8 items-center justify-center bg-slate-700 border border-slate-400 min-w-16 text-center mr-1
            ${durability.current === 0 ? UNMET_REQUIREMENT_TEXT_COLOR : "text-zinc-300"}`}
        >
          {durability.current}/{durability.max}
        </div>
      )}
      {price !== undefined && <PriceDisplay price={price} shardsOwned={shardsOwned ?? null} />}
    </div>
  );
});

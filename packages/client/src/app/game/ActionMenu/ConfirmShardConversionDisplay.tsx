import { BUTTON_HEIGHT } from "@/client_consts";
import React from "react";
import { ACTION_MENU_PAGE_SIZE } from ".";
import { getItemSellPrice } from "@speed-dungeon/common";
import { useGameStore } from "@/stores/game-store";
import Divider from "@/app/components/atoms/Divider";
import { ConfirmConvertToShardsMenuState } from "./menu-state/confirm-convert-to-shards";
import ShardsIcon from "../../../../public/img/game-ui-icons/shards.svg";

export function ConfirmShardConversionDisplay() {
  const currentMenu = useGameStore().getCurrentMenu();
  if (!(currentMenu instanceof ConfirmConvertToShardsMenuState))
    return <div>Unexpected menu state</div>;

  return (
    <div
      className="min-w-[25rem] max-w-[25rem]"
      style={{ height: `${BUTTON_HEIGHT * ACTION_MENU_PAGE_SIZE}rem` }}
    >
      <div className="border border-slate-400 bg-slate-700 min-w-[25rem] max-w-[25rem] p-2 flex flex-col items-center pointer-events-auto">
        <div className="">{currentMenu.item.entityProperties.name}</div>
        <Divider extraStyles="w-full" />

        <span className="text-lg bg-slate-700 mb-1">
          Convert to {getItemSellPrice(currentMenu.item)} shards?
        </span>
        <span className="text-yellow-400 mb-2">This will PERMANENTLY DESTROY the item! </span>
        <div className="relative">
          <ShardsIcon className="fill-yellow-400 h-10" />
        </div>
      </div>
    </div>
  );
}

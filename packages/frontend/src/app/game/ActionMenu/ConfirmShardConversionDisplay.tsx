import React from "react";
import { getItemSellPrice } from "@speed-dungeon/common";
import Divider from "@/app/components/atoms/Divider";
import ShardsIcon from "../../../../public/img/game-ui-icons/shards.svg";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { ACTION_MENU_CENTRAL_SECTION_HEIGHT } from "@/client-consts";
import { ConfirmConvertToShardsActionMenuScreen } from "@/client-application/action-menu/screens/convert-to-shards-confirm";

export function ConfirmShardConversionDisplay() {
  const clientApplication = useClientApplication();
  const { actionMenu } = clientApplication;
  const currentMenu = actionMenu.getCurrentMenu();

  if (!(currentMenu instanceof ConfirmConvertToShardsActionMenuScreen)) {
    return <div>Unexpected menu state</div>;
  }

  return (
    <div
      className="min-w-[25rem] max-w-[25rem]"
      style={{ height: `${ACTION_MENU_CENTRAL_SECTION_HEIGHT}rem` }}
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

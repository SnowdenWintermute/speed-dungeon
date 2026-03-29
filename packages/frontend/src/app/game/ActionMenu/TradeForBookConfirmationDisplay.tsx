import React from "react";
import { BookConsumableType, CONSUMABLE_TYPE_STRINGS, INFO_UNICODE_SYMBOL, Item, getBookLevelForTrade } from "@speed-dungeon/common";
import { useClientApplication } from "@/hooks/create-client-application-context";
import Divider from "@/app/components/atoms/Divider";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { IconName, SVG_ICONS } from "@/app/icons";

interface Props {
  item: Item;
  bookType: BookConsumableType;
  onClick: () => void;
}

export default function TradeForBookConfirmationDisplay({ item, bookType, onClick }: Props) {
  const clientApplication = useClientApplication();
  const party = clientApplication.gameContext.requireParty();
  const vendingMachineLevel = party.dungeonExplorationManager.getCurrentFloor();
  const bookLevel = getBookLevelForTrade(item.itemLevel, vendingMachineLevel);

  return (
    <div className="h-fit bg-slate-700 p-2 border border-slate-400 flex flex-col items-center pointer-events-auto">
      <div>{item.entityProperties.name}</div>
      <Divider extraStyles="w-full" />
      <p className="mb-1">
        {INFO_UNICODE_SYMBOL} You will recieve a skill book of item level equal to the lower value
        between the item's level ({item.itemLevel}) and HALF your current floor level (
        {vendingMachineLevel / 2}).{" "}
      </p>
      <Divider />
      <div className="text-lg bg-slate-700 mb-1 flex justify-center">
        Trade for {CONSUMABLE_TYPE_STRINGS[bookType]} V{bookLevel}?
      </div>
      <p className="text-yellow-400 mb-2">This will PERMANENTLY DESTROY the item!</p>
      <HotkeyButton
        onClick={onClick}
        className="border border-slate-400 bg-slate-800 h-10 px-2 hover:bg-slate-950"
      >
        <div className="flex items-center">
          <div>Confirm</div>
          <div className="relative">{SVG_ICONS[IconName.Book]("fill-yellow-400 h-6")}</div>
        </div>
      </HotkeyButton>
    </div>
  );
}

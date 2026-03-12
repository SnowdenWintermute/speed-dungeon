import { ACTION_MENU_CENTRAL_SECTION_HEIGHT } from "@/client-consts";
import React from "react";
import { Consumable, getItemSellPrice } from "@speed-dungeon/common";
import Divider from "@/app/components/atoms/Divider";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { ConfirmConvertToShardsActionMenuScreen } from "./menu-state/confirm-convert-to-shards";
import { ActionMenuScreenType } from "./menu-state/menu-state-type";
import { ConsideringItemActionMenuScreen } from "./menu-state/considering-item";
import ShardsIcon from "../../../../public/img/game-ui-icons/shards.svg";
import { AppStore } from "@/mobx-stores/app-store";
import { observer } from "mobx-react-lite";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";

export const ConsideringItemDisplay = observer(() => {
  const { actionMenuStore, gameStore, hotkeysStore } = AppStore.get();
  const currentMenu = actionMenuStore.getCurrentMenu();

  if (!(currentMenu instanceof ConsideringItemActionMenuScreen)) return <div>Unexpected menu state</div>;
  const shardReward = getItemSellPrice(currentMenu.item);

  const party = gameStore.getExpectedParty();
  const focusedCharacter = gameStore.getExpectedFocusedCharacter();

  const shardMenuButtonType = HotkeyButtonTypes.OpenConfirmConvertToShardMenu;

  return (
    <div
      className="min-w-[25rem] max-w-[25rem]"
      style={{ height: `${ACTION_MENU_CENTRAL_SECTION_HEIGHT}rem` }}
    >
      <div className="border border-slate-400 bg-slate-700 min-w-[25rem] max-w-[25rem] p-2 flex flex-col items-center pointer-events-auto">
        <div className="">{currentMenu.item.entityProperties.name}</div>
        <Divider extraStyles="w-full" />
        {currentMenu.item instanceof Consumable ? (
          <div>
            Select <span className="font-bold">use</span> to choose a target for this consumable
          </div>
        ) : (
          <div>Equipping this item will swap it with any currently equipped item</div>
        )}
        {focusedCharacter.combatantProperties.abilityProperties.shardConversionPermitted(
          party.currentRoom.roomType
        ) && (
          <div className="mt-4">
            <HotkeyButton
              className="border border-slate-400 w-full p-2 pl-3 pr-3 hover:bg-slate-950"
              hotkeys={hotkeysStore.getKeybind(shardMenuButtonType)}
              onClick={() => {
                actionMenuStore.pushStack(
                  new ConfirmConvertToShardsActionMenuScreen(currentMenu.item, ActionMenuScreenType.ItemSelected)
                );
              }}
            >
              <span>
                ({hotkeysStore.getKeybindString(shardMenuButtonType)}) Convert to {shardReward}{" "}
                <ShardsIcon className="fill-slate-400 h-6 inline" />
              </span>
            </HotkeyButton>
          </div>
        )}
      </div>
    </div>
  );
});

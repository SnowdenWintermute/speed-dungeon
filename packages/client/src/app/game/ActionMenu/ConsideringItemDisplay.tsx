import { BUTTON_HEIGHT } from "@/client_consts";
import React from "react";
import {
  Consumable,
  combatantIsAllowedToConvertItemsToShards,
  getItemSellPrice,
} from "@speed-dungeon/common";
import Divider from "@/app/components/atoms/Divider";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { ConfirmConvertToShardsMenuState } from "./menu-state/confirm-convert-to-shards";
import { MenuStateType } from "./menu-state/menu-state-type";
import { letterFromKeyCode } from "@/hotkeys";
import { ConsideringItemMenuState } from "./menu-state/considering-item";
import ShardsIcon from "../../../../public/img/game-ui-icons/shards.svg";
import { AppStore } from "@/mobx-stores/app-store";
import { observer } from "mobx-react-lite";
import { ACTION_MENU_PAGE_SIZE } from "./menu-state";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";

export const ConsideringItemDisplay = observer(() => {
  const { actionMenuStore, gameStore, hotkeysStore } = AppStore.get();
  const currentMenu = actionMenuStore.getCurrentMenu();

  if (!(currentMenu instanceof ConsideringItemMenuState)) return <div>Unexpected menu state</div>;
  const shardReward = getItemSellPrice(currentMenu.item);

  const party = gameStore.getExpectedParty();
  const focusedCharacter = gameStore.getExpectedFocusedCharacter();

  const shardMenuButtonType = HotkeyButtonTypes.OpenConfirmConvertToShardMenu;

  return (
    <div
      className="min-w-[25rem] max-w-[25rem]"
      style={{ height: `${BUTTON_HEIGHT * ACTION_MENU_PAGE_SIZE}rem` }}
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
        {combatantIsAllowedToConvertItemsToShards(
          focusedCharacter.combatantProperties,
          party.currentRoom.roomType
        ) && (
          <div className="mt-4">
            <HotkeyButton
              className="border border-slate-400 w-full p-2 pl-3 pr-3 hover:bg-slate-950"
              hotkeys={hotkeysStore.getKeybind(shardMenuButtonType)}
              onClick={() => {
                actionMenuStore.pushStack(
                  new ConfirmConvertToShardsMenuState(currentMenu.item, MenuStateType.ItemSelected)
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

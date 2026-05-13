import { ACTION_MENU_CENTRAL_SECTION_HEIGHT } from "@/client-consts";
import React from "react";
import { Consumable, getItemSellPrice } from "@speed-dungeon/common";
import Divider from "@/app/components/atoms/Divider";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import ShardsIcon from "../../../../public/img/game-ui-icons/shards.svg";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";
import { ConsideringItemActionMenuScreen } from "@/client-application/action-menu/screens/considering-item";
import { ConfirmConvertToShardsActionMenuScreen } from "@/client-application/action-menu/screens/convert-to-shards-confirm";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";
import { ActionMenuScreenType } from "@/client-application/action-menu/screen-types";

export const ConsideringItemDisplay = observer(() => {
  const clientApplication = useClientApplication();
  const { gameContext, actionMenu, uiStore, combatantFocus } = clientApplication;
  const party = gameContext.requireParty();

  const currentMenu = actionMenu.getCurrentMenu();

  if (!(currentMenu instanceof ConsideringItemActionMenuScreen)) {
    return <div>Unexpected menu state</div>;
  }
  const shardReward = getItemSellPrice(currentMenu.item);

  const focusedCharacter = combatantFocus.requireFocusedCharacter();

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
              hotkeys={uiStore.keybinds.getKeybind(shardMenuButtonType)}
              onClick={() => {
                actionMenu.pushStack(
                  new ConfirmConvertToShardsActionMenuScreen(
                    clientApplication,
                    currentMenu.item,
                    ActionMenuScreenType.ItemSelected
                  )
                );
              }}
            >
              <span>
                ({uiStore.keybinds.getKeybindString(shardMenuButtonType)}) Convert to {shardReward}{" "}
                <ShardsIcon className="fill-slate-400 h-6 inline" />
              </span>
            </HotkeyButton>
          </div>
        )}
      </div>
    </div>
  );
});

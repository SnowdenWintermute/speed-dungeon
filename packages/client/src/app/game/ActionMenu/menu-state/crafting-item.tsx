import { useGameStore } from "@/stores/game-store";
import {
  ActionButtonCategory,
  ActionButtonsByCategory,
  ActionMenuButtonProperties,
  ActionMenuState,
  MenuStateType,
} from ".";
import {
  CRAFTING_ACTION_DESCRIPTIONS,
  CRAFTING_ACTION_DISABLED_CONDITIONS,
  CRAFTING_ACTION_STRINGS,
  ClientToServerEvent,
  CraftingAction,
  Equipment,
  INFO_UNICODE_SYMBOL,
  getCraftingActionPrice,
  iterateNumericEnum,
} from "@speed-dungeon/common";
import { setAlert } from "@/app/components/alerts";
import selectItem from "@/utils/selectItem";
import clientUserControlsCombatant from "@/utils/client-user-controls-combatant";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { websocketConnection } from "@/singletons/websocket-connection";
import ShardsIcon from "../../../../../public/img/game-ui-icons/shards.svg";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { setInventoryOpen } from "./common-buttons/open-inventory";
import { createCancelButton } from "./common-buttons/cancel";

const useItemHotkey = HOTKEYS.MAIN_1;
const useItemLetter = letterFromKeyCode(useItemHotkey);
export const USE_CONSUMABLE_BUTTON_TEXT = `Use (${useItemLetter})`;
export const EQUIP_ITEM_BUTTON_TEXT = `Equip (${useItemLetter})`;

export class CraftingItemMenuState implements ActionMenuState {
  page = 1;
  numPages: number = 1;
  type = MenuStateType.CraftingActionSelection;
  constructor(public item: Equipment) {}
  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();

    toReturn[ActionButtonCategory.Top].push(createCancelButton([], () => selectItem(null)));
    toReturn[ActionButtonCategory.Top].push(setInventoryOpen);

    const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
    if (focusedCharacterResult instanceof Error) {
      setAlert(focusedCharacterResult.message);
      return toReturn;
    }

    const characterId = focusedCharacterResult.entityProperties.id;
    const userControlsThisCharacter = clientUserControlsCombatant(characterId);
    const itemId = this.item.entityProperties.id;
    const partyResult = useGameStore.getState().getParty();
    if (partyResult instanceof Error) {
      setAlert(partyResult);
      return toReturn;
    }

    for (const craftingAction of iterateNumericEnum(CraftingAction)) {
      const actionPrice = getCraftingActionPrice(craftingAction, this.item);
      const buttonName = `${CRAFTING_ACTION_STRINGS[craftingAction]}`;
      const button = new ActionMenuButtonProperties(
        (
          <div className="flex justify-between w-full pr-2">
            <div className="flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis flex-1">
              <HoverableTooltipWrapper
                extraStyles="inline mr-2"
                tooltipText={CRAFTING_ACTION_DESCRIPTIONS[craftingAction]}
              >
                {INFO_UNICODE_SYMBOL}
              </HoverableTooltipWrapper>
              {buttonName}
            </div>
            <div className="w-fit flex h-full items-center">
              <span className="mr-1">{actionPrice}</span>
              <ShardsIcon className="h-[20px] fill-slate-400" />
            </div>
          </div>
        ),
        buttonName,
        () => {
          useGameStore.getState().mutateState((state) => {
            state.combatantsWithPendingCraftActions[focusedCharacterResult.entityProperties.id] =
              true;
          });
          websocketConnection.emit(ClientToServerEvent.PerformCraftingAction, {
            characterId: focusedCharacterResult.entityProperties.id,
            itemId,
            craftingAction,
          });
        }
      );
      button.shouldBeDisabled =
        !userControlsThisCharacter ||
        actionPrice > focusedCharacterResult.combatantProperties.inventory.shards ||
        CRAFTING_ACTION_DISABLED_CONDITIONS[craftingAction](this.item, partyResult.currentFloor) ||
        !!useGameStore.getState().combatantsWithPendingCraftActions[
          focusedCharacterResult.entityProperties.id
        ];
      toReturn[ActionButtonCategory.Numbered].push(button);
    }

    return toReturn;
  }
}

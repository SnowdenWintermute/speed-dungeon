import { ActionMenuState } from ".";
import { Equipment } from "@speed-dungeon/common";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStateType } from "./menu-state-type";
import GoBackButton from "./common-buttons/GoBackButton";
import ToggleInventoryButton from "./common-buttons/ToggleInventory";

const useItemHotkey = HOTKEYS.MAIN_1;
const useItemLetter = letterFromKeyCode(useItemHotkey);
export const USE_CONSUMABLE_BUTTON_TEXT = `Use (${useItemLetter})`;
export const EQUIP_ITEM_BUTTON_TEXT = `Equip (${useItemLetter})`;

export class CraftingItemMenuState extends ActionMenuState {
  constructor(public item: Equipment) {
    super(MenuStateType.CraftingActionSelection);
  }

  getTopSection() {
    return (
      <ul className="flex">
        <GoBackButton
          extraFn={() => {
            AppStore.get().focusStore.selectItem(null);
          }}
        />
        <ToggleInventoryButton />
      </ul>
    );
  }

  getNumberedButtons() {
    return [];
  }

  // getButtonProperties(): ActionButtonsByCategory {
  //   const toReturn = new ActionButtonsByCategory();

  //   const { gameStore, actionMenuStore } = AppStore.get();
  //   const focusedCharacterResult = gameStore.getExpectedFocusedCharacter();

  //   const userControlsThisCharacter = gameStore.clientUserControlsFocusedCombatant();
  //   const itemId = this.item.entityProperties.id;

  //   for (const craftingAction of iterateNumericEnum(CraftingAction)) {
  //     const actionPrice = getCraftingActionPrice(craftingAction, this.item);
  //     const buttonName = `${CRAFTING_ACTION_STRINGS[craftingAction]}`;
  //     const button = new ActionMenuButtonProperties(
  //       () => (
  //         <div className="flex justify-between w-full pr-2">
  //           <div className="flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis flex-1">
  //             <HoverableTooltipWrapper
  //               extraStyles="inline mr-2"
  //               tooltipText={CRAFTING_ACTION_DESCRIPTIONS[craftingAction]}
  //             >
  //               {INFO_UNICODE_SYMBOL}
  //             </HoverableTooltipWrapper>
  //             {buttonName}
  //           </div>
  //           <div className="w-fit flex h-full items-center">
  //             <span className="mr-1">{actionPrice}</span>
  //             <ShardsIcon className="h-[20px] fill-slate-400" />
  //           </div>
  //         </div>
  //       ),
  //       buttonName,
  //       () => {
  //         actionMenuStore.setCharacterIsCrafting(focusedCharacterResult.getEntityId());
  //         websocketConnection.emit(ClientToServerEvent.PerformCraftingAction, {
  //           characterId: focusedCharacterResult.entityProperties.id,
  //           itemId,
  //           craftingAction,
  //         });
  //       }
  //     );

  //     const party = gameStore.getExpectedParty();

  //     button.shouldBeDisabled =
  //       !userControlsThisCharacter ||
  //       actionPrice > focusedCharacterResult.combatantProperties.inventory.shards ||
  //       CRAFTING_ACTION_DISABLED_CONDITIONS[craftingAction](
  //         this.item,
  //         party.dungeonExplorationManager.getCurrentFloor()
  //       ) ||
  //       actionMenuStore.characterIsCrafting(focusedCharacterResult.getEntityId());
  //     toReturn[ActionButtonCategory.Numbered].push(button);
  //   }

  //   return toReturn;
  // }
}

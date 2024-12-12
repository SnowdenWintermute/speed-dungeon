import { useGameStore } from "@/stores/game-store";
import {
  ActionButtonCategory,
  ActionButtonsByCategory,
  ActionMenuButtonProperties,
  ActionMenuState,
  MenuStateType,
} from ".";
import {
  ClientToServerEvent,
  CombatActionType,
  CombatantProperties,
  EquipmentType,
  Item,
  ItemPropertiesType,
} from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { setAlert } from "@/app/components/alerts";
import { useUIStore } from "@/stores/ui-store";
import selectItem from "@/utils/selectItem";
import clientUserControlsCombatant from "@/utils/client-user-controls-combatant";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";

const equipAltSlotHotkey = HOTKEYS.ALT_1;
const useItemHotkey = HOTKEYS.MAIN_1;
const useItemLetter = letterFromKeyCode(useItemHotkey);
const dropItemHotkey = HOTKEYS.MAIN_2;
export const USE_CONSUMABLE_BUTTON_TEXT = `Use (${useItemLetter})`;
export const EQUIP_ITEM_BUTTON_TEXT = `Equip (${useItemLetter})`;

export class ConsideringItemMenuState implements ActionMenuState {
  page = 1;
  numPages: number = 1;
  type = MenuStateType.ItemSelected;
  constructor(public item: Item) {}
  setItem(item: Item) {
    this.item = item;
    selectItem(item);
  }
  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();

    const cancelButton = new ActionMenuButtonProperties("Cancel", () => {
      useGameStore.getState().mutateState((state) => {
        state.stackedMenuStates.pop();
      });
      selectItem(null);
    });

    cancelButton.dedicatedKeys = [HOTKEYS.CANCEL];
    toReturn[ActionButtonCategory.Top].push(cancelButton);

    const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
    if (focusedCharacterResult instanceof Error) {
      setAlert(focusedCharacterResult.message);
      return toReturn;
    }

    const characterId = focusedCharacterResult.entityProperties.id;
    const userControlsThisCharacter = clientUserControlsCombatant(characterId);
    const itemId = this.item.entityProperties.id;

    const useItemHotkey = HOTKEYS.MAIN_1;
    const useItemLetter = letterFromKeyCode(useItemHotkey);
    const slotItemIsEquippedTo = CombatantProperties.getSlotItemIsEquippedTo(
      focusedCharacterResult.combatantProperties,
      itemId
    );

    if (
      !useUIStore.getState().modKeyHeld &&
      this.item.itemProperties.type === ItemPropertiesType.Equipment &&
      (this.item.itemProperties.equipmentProperties.equipmentBaseItemProperties.type ===
        EquipmentType.OneHandedMeleeWeapon ||
        this.item.itemProperties.equipmentProperties.equipmentBaseItemProperties.type ===
          EquipmentType.Ring) &&
      slotItemIsEquippedTo === null
    ) {
      const equipToAltSlotButton = new ActionMenuButtonProperties(
        `Equip Alt. (${letterFromKeyCode(equipAltSlotHotkey)})`,
        () => {
          websocketConnection.emit(ClientToServerEvent.EquipInventoryItem, {
            characterId,
            itemId,
            equipToAltSlot: true,
          });
        }
      );
      equipToAltSlotButton.dedicatedKeys = [equipAltSlotHotkey];
      toReturn[ActionButtonCategory.Top].push(equipToAltSlotButton);
    }

    const useItemButton = (() => {
      switch (this.item.itemProperties.type) {
        case ItemPropertiesType.Equipment:
          if (slotItemIsEquippedTo !== null)
            return new ActionMenuButtonProperties(`Unequip (${useItemLetter})`, () => {
              websocketConnection.emit(ClientToServerEvent.UnequipSlot, {
                characterId,
                slot: slotItemIsEquippedTo,
              });
            });
          else
            return new ActionMenuButtonProperties(EQUIP_ITEM_BUTTON_TEXT, () => {
              websocketConnection.emit(ClientToServerEvent.EquipInventoryItem, {
                characterId,
                itemId,
                equipToAltSlot: useUIStore.getState().modKeyHeld,
              });
            });
        case ItemPropertiesType.Consumable:
          return new ActionMenuButtonProperties(USE_CONSUMABLE_BUTTON_TEXT, () => {
            websocketConnection.emit(ClientToServerEvent.SelectCombatAction, {
              characterId,
              combatActionOption: {
                type: CombatActionType.ConsumableUsed,
                itemId,
              },
            });
          });
      }
    })();

    useItemButton.dedicatedKeys = ["Enter", useItemHotkey];
    useItemButton.shouldBeDisabled = !userControlsThisCharacter;
    toReturn[ActionButtonCategory.Top].push(useItemButton);

    const dropItemButton = new ActionMenuButtonProperties(
      `Drop (${letterFromKeyCode(dropItemHotkey)})`,
      () => {
        const slotEquipped = CombatantProperties.getSlotItemIsEquippedTo(
          focusedCharacterResult.combatantProperties,
          itemId
        );

        if (slotEquipped)
          websocketConnection.emit(ClientToServerEvent.DropEquippedItem, {
            characterId,
            slot: slotEquipped,
          });
        else websocketConnection.emit(ClientToServerEvent.DropItem, { characterId, itemId });

        useGameStore.getState().mutateState((state) => {
          state.stackedMenuStates.pop();
          state.hoveredEntity = null;
          state.consideredItemUnmetRequirements = null;
          state.detailedEntity = null;
        });
      }
    );

    dropItemButton.shouldBeDisabled = !userControlsThisCharacter;
    dropItemButton.dedicatedKeys = [dropItemHotkey];
    toReturn[ActionButtonCategory.Top].push(dropItemButton);

    return toReturn;
  }
}

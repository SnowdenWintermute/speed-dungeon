import { ActionMenuState } from ".";
import {
  ActionAndRank,
  ClientToServerEvent,
  CombatantProperties,
  Consumable,
  Equipment,
  EquipmentType,
  Item,
  Option,
} from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { setAlert } from "@/app/components/alerts";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { createCancelButton } from "./common-buttons/cancel";
import { AppStore } from "@/mobx-stores/app-store";
import { ModifierKey } from "@/mobx-stores/input";
import { ActionMenuButtonProperties } from "./action-menu-button-properties";
import { MenuStateType } from "./menu-state-type";
import { ActionButtonCategory, ActionButtonsByCategory } from "./action-buttons-by-category";

const equipAltSlotHotkey = HOTKEYS.ALT_1;
const useItemHotkey = HOTKEYS.MAIN_1;
const useItemLetter = letterFromKeyCode(useItemHotkey);
const dropItemHotkey = HOTKEYS.MAIN_2;
export const USE_CONSUMABLE_BUTTON_TEXT = `Use (${useItemLetter})`;
export const EQUIP_ITEM_BUTTON_TEXT = `Equip (${useItemLetter})`;

export class ConsideringItemMenuState extends ActionMenuState {
  constructor(public item: Item) {
    super(MenuStateType.ItemSelected, 1);
  }
  setItem(item: Item) {
    this.item = item;
    AppStore.get().focusStore.selectItem(item);
  }
  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();

    toReturn[ActionButtonCategory.Top].push(
      createCancelButton([], () => AppStore.get().focusStore.selectItem(null))
    );

    const { gameStore } = AppStore.get();
    const focusedCharacter = gameStore.getExpectedFocusedCharacter();
    const characterId = focusedCharacter.getEntityId();

    const itemId = this.item.entityProperties.id;

    const useItemHotkey = HOTKEYS.MAIN_1;
    const useItemLetter = letterFromKeyCode(useItemHotkey);
    const slotItemIsEquippedTo =
      focusedCharacter.combatantProperties.equipment.getSlotItemIsEquippedTo(itemId);

    const { inputStore } = AppStore.get();

    const modKeyHeld = inputStore.getKeyIsHeld(ModifierKey.Mod);

    if (
      !modKeyHeld &&
      this.item instanceof Equipment &&
      (this.item.equipmentBaseItemProperties.taggedBaseEquipment.equipmentType ===
        EquipmentType.OneHandedMeleeWeapon ||
        this.item.equipmentBaseItemProperties.taggedBaseEquipment.equipmentType ===
          EquipmentType.Ring) &&
      slotItemIsEquippedTo === null
    ) {
      const equipToAltSlotButton = new ActionMenuButtonProperties(
        () => `Equip Alt. (${letterFromKeyCode(equipAltSlotHotkey)})`,
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
      if (this.item instanceof Equipment) {
        if (slotItemIsEquippedTo !== null)
          return new ActionMenuButtonProperties(
            () => `Unequip (${useItemLetter})`,
            `Unequip (${useItemLetter})`,
            () => {
              websocketConnection.emit(ClientToServerEvent.UnequipSlot, {
                characterId,
                slot: slotItemIsEquippedTo,
              });
            }
          );
        else
          return new ActionMenuButtonProperties(
            () => EQUIP_ITEM_BUTTON_TEXT,
            EQUIP_ITEM_BUTTON_TEXT,
            () => {
              const modKeyHeld = inputStore.getKeyIsHeld(ModifierKey.Mod);
              websocketConnection.emit(ClientToServerEvent.EquipInventoryItem, {
                characterId,
                itemId,
                equipToAltSlot: modKeyHeld,
              });
            }
          );
      } else if (this.item instanceof Consumable) {
        const actionName = this.item.getActionName();
        if (actionName === null)
          throw new Error("expected consumable to have an associated action name");

        const eventData: {
          characterId: string;
          actionAndRankOption: Option<ActionAndRank>;
          itemIdOption?: string;
        } = {
          characterId,
          actionAndRankOption: new ActionAndRank(actionName, 1),
        };

        if (Consumable.isSkillBook(this.item.consumableType))
          eventData.itemIdOption = this.item.entityProperties.id;

        return new ActionMenuButtonProperties(
          () => USE_CONSUMABLE_BUTTON_TEXT,
          USE_CONSUMABLE_BUTTON_TEXT,
          () => {
            websocketConnection.emit(ClientToServerEvent.SelectCombatAction, eventData);
          }
        );
      } else {
        setAlert(new Error("unknown item type"));
        throw new Error("unknown item type");
      }
    })();

    useItemButton.dedicatedKeys = ["Enter", useItemHotkey];

    const userDoesNotControlCharacter = !gameStore.clientUserControlsFocusedCombatant();
    useItemButton.shouldBeDisabled = userDoesNotControlCharacter;
    toReturn[ActionButtonCategory.Top].push(useItemButton);

    const dropItemButton = new ActionMenuButtonProperties(
      () => `Drop (${letterFromKeyCode(dropItemHotkey)})`,
      `Drop (${letterFromKeyCode(dropItemHotkey)})`,
      () => {
        const slotEquipped =
          focusedCharacter.combatantProperties.equipment.getSlotItemIsEquippedTo(itemId);

        if (slotEquipped)
          websocketConnection.emit(ClientToServerEvent.DropEquippedItem, {
            characterId,
            slot: slotEquipped,
          });
        else websocketConnection.emit(ClientToServerEvent.DropItem, { characterId, itemId });

        AppStore.get().actionMenuStore.popStack();
        AppStore.get().focusStore.detailables.clearDetailed();
      }
    );

    dropItemButton.shouldBeDisabled = userDoesNotControlCharacter;
    dropItemButton.dedicatedKeys = [dropItemHotkey];
    toReturn[ActionButtonCategory.Top].push(dropItemButton);

    return toReturn;
  }
}

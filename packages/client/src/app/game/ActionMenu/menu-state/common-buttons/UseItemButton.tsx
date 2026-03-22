import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import {
  ActionAndRank,
  ActionRank,
  ClientIntentType,
  CombatantId,
  Consumable,
  Equipment,
  Item,
  Option,
  TaggedEquipmentSlot,
} from "@speed-dungeon/common";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { ModifierKey } from "@/mobx-stores/input";
import { setAlert } from "@/app/components/alerts";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";
import { observer } from "mobx-react-lite";
import { gameClientSingleton } from "@/singletons/lobby-client";

const { hotkeysStore } = AppStore.get();
const buttonType = HotkeyButtonTypes.Confirm;
const useItemHotkeys = hotkeysStore.getKeybind(buttonType);
const useItemHotkeyString = hotkeysStore.getKeybindString(buttonType);

interface Props {
  item: Item;
}

export const UseItemButton = observer((props: Props) => {
  const { item } = props;

  const { gameStore } = AppStore.get();
  const focusedCharacter = gameStore.getExpectedFocusedCharacter();

  const itemId = item.entityProperties.id;
  const slotItemIsEquippedTo =
    focusedCharacter.combatantProperties.equipment.getSlotItemIsEquippedTo(itemId);

  const isEquipped = slotItemIsEquippedTo !== null;
  const buttonText = getUseItemButtonText(item, isEquipped);
  const clickHandler = getUseItemClickHandler(item, slotItemIsEquippedTo);

  const userDoesNotControlCharacter = !gameStore.clientUserControlsFocusedCombatant();
  const shouldBeDisabled = userDoesNotControlCharacter;

  return (
    <ActionMenuTopButton
      hotkeys={useItemHotkeys}
      handleClick={clickHandler}
      disabled={shouldBeDisabled}
    >
      {buttonText}
    </ActionMenuTopButton>
  );
});

export const USE_CONSUMABLE_BUTTON_TEXT = `Use (${useItemHotkeyString})`;
export const EQUIP_ITEM_BUTTON_TEXT = `Equip (${useItemHotkeyString})`;
export const UNEQUIP_ITEM_BUTTON_TEXT = `Unequip (${useItemHotkeyString})`;

function getUseItemButtonText(item: Item, isEquipped: boolean) {
  const isEquipment = item instanceof Equipment;
  if (isEquipment && isEquipped) {
    return UNEQUIP_ITEM_BUTTON_TEXT;
  } else if (isEquipment) {
    return EQUIP_ITEM_BUTTON_TEXT;
  } else {
    return USE_CONSUMABLE_BUTTON_TEXT;
  }
}

function getUseItemClickHandler(item: Item, slotItemIsEquippedTo: null | TaggedEquipmentSlot) {
  const isEquipment = item instanceof Equipment;
  const isEquipped = slotItemIsEquippedTo !== null;
  const isConsumable = item instanceof Consumable;

  const { gameStore, inputStore } = AppStore.get();
  const focusedCharacter = gameStore.getExpectedFocusedCharacter();
  const characterId = focusedCharacter.getEntityId();

  if (isEquipment && isEquipped) {
    return () => {
      gameClientSingleton.get().dispatchIntent({
        type: ClientIntentType.UnequipSlot,
        data: {
          characterId,
          slot: slotItemIsEquippedTo,
        },
      });
    };
  } else if (isEquipment) {
    return () => {
      const modKeyHeld = inputStore.getKeyIsHeld(ModifierKey.Mod);
      gameClientSingleton.get().dispatchIntent({
        type: ClientIntentType.EquipInventoryItem,
        data: {
          characterId,
          itemId: item.getEntityId(),
          equipToAlternateSlot: modKeyHeld,
        },
      });
    };
  } else if (isConsumable) {
    const actionName = item.getActionName();

    if (actionName === null) {
      throw new Error("expected consumable to have an associated action name");
    }

    const eventData: {
      characterId: CombatantId;
      actionAndRankOption: Option<ActionAndRank>;
      itemIdOption?: string;
    } = {
      characterId,
      actionAndRankOption: new ActionAndRank(actionName, 1 as ActionRank),
    };

    if (Consumable.isSkillBook(item.consumableType)) {
      eventData.itemIdOption = item.entityProperties.id;
    }

    return () => {
      gameClientSingleton
        .get()
        .dispatchIntent({ type: ClientIntentType.SelectCombatAction, data: eventData });
    };
  } else {
    setAlert(new Error("unknown item type"));
    throw new Error("unknown item type");
  }
}

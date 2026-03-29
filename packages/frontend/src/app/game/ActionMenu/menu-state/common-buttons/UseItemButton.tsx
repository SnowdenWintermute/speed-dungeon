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
import { observer } from "mobx-react-lite";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";
import { ClientApplication } from "@/client-application";
import { ModifierKey } from "@/client-application/ui/inputs";

interface Props {
  item: Item;
}

export const UseItemButton = observer((props: Props) => {
  const { item } = props;
  const clientApplication = useClientApplication();
  const { combatantFocus, uiStore } = clientApplication;
  const { keybinds } = uiStore;
  const focusedCharacter = combatantFocus.requireFocusedCharacter();
  const buttonType = HotkeyButtonTypes.Confirm;
  const useItemHotkeys = keybinds.getKeybind(buttonType);
  const useItemHotkeyString = keybinds.getKeybindString(buttonType);

  const itemId = item.entityProperties.id;
  const slotItemIsEquippedTo =
    focusedCharacter.combatantProperties.equipment.getSlotItemIsEquippedTo(itemId);

  const isEquipped = slotItemIsEquippedTo !== null;

  const USE_CONSUMABLE_BUTTON_TEXT = `Use (${useItemHotkeyString})`;
  const EQUIP_ITEM_BUTTON_TEXT = `Equip (${useItemHotkeyString})`;
  const UNEQUIP_ITEM_BUTTON_TEXT = `Unequip (${useItemHotkeyString})`;

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

  const buttonText = getUseItemButtonText(item, isEquipped);
  const clickHandler = getUseItemClickHandler(item, slotItemIsEquippedTo, clientApplication);

  const userDoesNotControlCharacter = !combatantFocus.clientUserControlsFocusedCombatant();
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

function getUseItemClickHandler(
  item: Item,
  slotItemIsEquippedTo: null | TaggedEquipmentSlot,
  clientApplication: ClientApplication
) {
  const isEquipment = item instanceof Equipment;
  const isEquipped = slotItemIsEquippedTo !== null;
  const isConsumable = item instanceof Consumable;

  const { combatantFocus, gameClientRef, uiStore, alertsService } = clientApplication;
  const focusedCharacter = combatantFocus.requireFocusedCharacter();
  const characterId = focusedCharacter.getEntityId();

  if (isEquipment && isEquipped) {
    return () => {
      gameClientRef.get().dispatchIntent({
        type: ClientIntentType.UnequipSlot,
        data: {
          characterId,
          slot: slotItemIsEquippedTo,
        },
      });
    };
  } else if (isEquipment) {
    return () => {
      const modKeyHeld = uiStore.inputs.getKeyIsHeld(ModifierKey.Mod);
      gameClientRef.get().dispatchIntent({
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
      gameClientRef
        .get()
        .dispatchIntent({ type: ClientIntentType.SelectCombatAction, data: eventData });
    };
  } else {
    alertsService.setAlert(new Error("unknown item type"));
    throw new Error("unknown item type");
  }
}

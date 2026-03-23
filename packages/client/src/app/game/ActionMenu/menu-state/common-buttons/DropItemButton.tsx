import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { ClientIntentType, Item } from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";

interface Props {
  item: Item;
}

export const DropItemButton = observer((props: Props) => {
  const clientApplication = useClientApplication();
  const { combatantFocus, uiStore, actionMenu, gameClientRef, detailableEntityFocus } =
    clientApplication;
  const { keybinds } = uiStore;
  const focusedCharacter = combatantFocus.requireFocusedCharacter();
  const characterId = focusedCharacter.getEntityId();
  const itemId = props.item.entityProperties.id;
  const userDoesNotControlCharacter = !combatantFocus.clientUserControlsFocusedCombatant({
    includePets: true,
  });

  const dropItemHotkeys = keybinds.getKeybind(HotkeyButtonTypes.DropItem);
  const dropItemHotkeysString = keybinds.getKeybindString(HotkeyButtonTypes.DropItem);

  function clickHandler() {
    const slotEquipped =
      focusedCharacter.combatantProperties.equipment.getSlotItemIsEquippedTo(itemId);

    if (slotEquipped !== null) {
      gameClientRef.get().dispatchIntent({
        type: ClientIntentType.DropEquippedItem,
        data: {
          characterId,
          slot: slotEquipped,
        },
      });
    } else {
      gameClientRef.get().dispatchIntent({
        type: ClientIntentType.DropItem,
        data: { characterId, itemId },
      });
    }

    actionMenu.popStack();
    detailableEntityFocus.detailables.clearDetailed();
  }

  const shouldBeDisabled = userDoesNotControlCharacter;

  return (
    <ActionMenuTopButton
      disabled={shouldBeDisabled}
      hotkeys={dropItemHotkeys}
      handleClick={clickHandler}
    >
      Drop ({dropItemHotkeysString})
    </ActionMenuTopButton>
  );
});

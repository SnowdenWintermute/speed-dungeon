import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { ClientIntentType, Item } from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";

interface Props {
  item: Item;
}

export const EquipToAltSlotButton = observer((props: Props) => {
  const clientApplication = useClientApplication();
  const { uiStore, gameClientRef, combatantFocus } = clientApplication;
  const { keybinds } = uiStore;
  const equipAltSlotHotkeys = keybinds.getKeybind(HotkeyButtonTypes.EquipAltSlot);
  const equipAltSlotHotkeysString = keybinds.getKeybindString(HotkeyButtonTypes.EquipAltSlot);
  const userDoesNotControlCharacter = !combatantFocus.clientUserControlsFocusedCombatant();
  const shouldBeDisabled = userDoesNotControlCharacter;
  return (
    <ActionMenuTopButton
      disabled={shouldBeDisabled}
      hotkeys={equipAltSlotHotkeys}
      handleClick={() => {
        const characterId = combatantFocus.requireFocusedCharacterId();
        gameClientRef.get().dispatchIntent({
          type: ClientIntentType.EquipInventoryItem,
          data: {
            characterId,
            itemId: props.item.getEntityId(),
            equipToAlternateSlot: true,
          },
        });
      }}
    >{`Equip Alt. (${equipAltSlotHotkeysString})`}</ActionMenuTopButton>
  );
});

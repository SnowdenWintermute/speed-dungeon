import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { ClientIntentType, Item } from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";
import { gameClientSingleton } from "@/singletons/lobby-client";

const { hotkeysStore } = AppStore.get();
const equipAltSlotHotkeys = hotkeysStore.getKeybind(HotkeyButtonTypes.EquipAltSlot);
const equipAltSlotHotkeysString = hotkeysStore.getKeybindString(HotkeyButtonTypes.EquipAltSlot);

interface Props {
  item: Item;
}

export const EquipToAltSlotButton = observer((props: Props) => {
  const { gameStore } = AppStore.get();
  const userDoesNotControlCharacter = !gameStore.clientUserControlsFocusedCombatant();
  const shouldBeDisabled = userDoesNotControlCharacter;
  return (
    <ActionMenuTopButton
      disabled={shouldBeDisabled}
      hotkeys={equipAltSlotHotkeys}
      handleClick={() => {
        const { gameStore } = AppStore.get();
        const characterId = gameStore.getExpectedFocusedCharacterId();
        gameClientSingleton.get().dispatchIntent({
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

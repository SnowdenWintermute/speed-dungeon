import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { AppStore } from "@/mobx-stores/app-store";
import { ClientToServerEvent, Item } from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { observer } from "mobx-react-lite";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";

const { hotkeys } = AppStore.get();
const equipAltSlotHotkeys = hotkeys.getKeybind(HotkeyButtonTypes.EquipAltSlot);
const equipAltSlotHotkeysString = hotkeys.getKeybindString(HotkeyButtonTypes.EquipAltSlot);

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
        websocketConnection.emit(ClientToServerEvent.EquipInventoryItem, {
          characterId,
          itemId: props.item.entityProperties.id,
          equipToAltSlot: true,
        });
      }}
    >{`Equip Alt. (${equipAltSlotHotkeysString})`}</ActionMenuTopButton>
  );
});

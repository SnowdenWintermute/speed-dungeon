import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { AppStore } from "@/mobx-stores/app-store";
import { websocketConnection } from "@/singletons/websocket-connection";
import { ClientToServerEvent, Item } from "@speed-dungeon/common";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";
import { observer } from "mobx-react-lite";

interface Props {
  item: Item;
}

const { hotkeys } = AppStore.get();
const dropItemHotkeys = hotkeys.getKeybind(HotkeyButtonTypes.DropItem);
const dropItemHotkeysString = hotkeys.getKeybindString(HotkeyButtonTypes.DropItem);

export const DropItemButton = observer((props: Props) => {
  const { gameStore } = AppStore.get();
  const focusedCharacter = gameStore.getExpectedFocusedCharacter();
  const characterId = focusedCharacter.getEntityId();
  const itemId = props.item.entityProperties.id;
  const userDoesNotControlCharacter = !gameStore.clientUserControlsFocusedCombatant();

  function clickHandler() {
    const slotEquipped =
      focusedCharacter.combatantProperties.equipment.getSlotItemIsEquippedTo(itemId);

    if (slotEquipped !== null) {
      websocketConnection.emit(ClientToServerEvent.DropEquippedItem, {
        characterId,
        slot: slotEquipped,
      });
    } else {
      websocketConnection.emit(ClientToServerEvent.DropItem, { characterId, itemId });
    }

    AppStore.get().actionMenuStore.popStack();
    AppStore.get().focusStore.detailables.clearDetailed();
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

import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { AppStore } from "@/mobx-stores/app-store";
import { ClientIntentType, Item } from "@speed-dungeon/common";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";
import { observer } from "mobx-react-lite";
import { gameClientSingleton } from "@/singletons/lobby-client";

interface Props {
  item: Item;
}

const { hotkeysStore } = AppStore.get();
const dropItemHotkeys = hotkeysStore.getKeybind(HotkeyButtonTypes.DropItem);
const dropItemHotkeysString = hotkeysStore.getKeybindString(HotkeyButtonTypes.DropItem);

export const DropItemButton = observer((props: Props) => {
  const { gameStore } = AppStore.get();
  const focusedCharacter = gameStore.getExpectedFocusedCharacter();
  const characterId = focusedCharacter.getEntityId();
  const itemId = props.item.entityProperties.id;
  const userDoesNotControlCharacter = !gameStore.clientUserControlsFocusedCombatant({
    includePets: true,
  });

  function clickHandler() {
    const slotEquipped =
      focusedCharacter.combatantProperties.equipment.getSlotItemIsEquippedTo(itemId);

    if (slotEquipped !== null) {
      gameClientSingleton.get().dispatchIntent({
        type: ClientIntentType.DropEquippedItem,
        data: {
          characterId,
          slot: slotEquipped,
        },
      });
    } else {
      gameClientSingleton.get().dispatchIntent({
        type: ClientIntentType.DropItem,
        data: { characterId, itemId },
      });
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

import { AppStore } from "@/mobx-stores/app-store";
import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { websocketConnection } from "@/singletons/websocket-connection";
import { ClientToServerEvent } from "@speed-dungeon/common";
import { MenuStateType } from "../menu-state-type";
import { ConfirmConvertToShardsMenuState } from "../confirm-convert-to-shards";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";

interface Props {
  menuState: ConfirmConvertToShardsMenuState;
}

export function ConfirmShardConversionButton(props: Props) {
  const { menuState } = props;
  const { gameStore } = AppStore.get();

  const focusedCharacter = gameStore.getExpectedFocusedCharacter();
  const itemId = menuState.item.entityProperties.id;
  const { hotkeysStore } = AppStore.get();
  const buttonType = HotkeyButtonTypes.Confirm;
  const shouldBeDisabled = !gameStore.clientUserControlsFocusedCombatant();

  return (
    <ActionMenuTopButton
      disabled={shouldBeDisabled}
      hotkeys={hotkeysStore.getKeybind(buttonType)}
      handleClick={() => {
        websocketConnection.emit(ClientToServerEvent.ConvertItemsToShards, {
          characterId: focusedCharacter.getEntityId(),
          itemIds: [itemId],
        });
        AppStore.get().actionMenuStore.popStack();
        if (menuState.type === MenuStateType.ItemSelected) {
          // converting to shards from the inventory nessecitates going back two
          // stacked menus since we go itemSelected -> confirmShard and now that the item is
          // shards it doesn't make sense we would have it selected
          AppStore.get().actionMenuStore.popStack();
        }
        AppStore.get().focusStore.clearItemComparison();
      }}
    >
      Convert ({hotkeysStore.getKeybindString(buttonType)})
    </ActionMenuTopButton>
  );
}

import { AppStore } from "@/mobx-stores/app-store";
import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { ClientIntentType } from "@speed-dungeon/common";
import { ActionMenuScreenType } from "../menu-state-type";
import { ConfirmConvertToShardsActionMenuScreen as ConfirmConvertToShardsActionMenuScreenOld } from "../confirm-convert-to-shards";
import { ConfirmConvertToShardsActionMenuScreen } from "@/client-application/action-menu/screens/convert-to-shards-confirm";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";
import { gameClientSingleton } from "@/singletons/lobby-client";

interface Props {
  menuState: ConfirmConvertToShardsActionMenuScreenOld | ConfirmConvertToShardsActionMenuScreen;
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
        gameClientSingleton.get().dispatchIntent({
          type: ClientIntentType.ConvertItemsToShards,
          data: {
            characterId: focusedCharacter.getEntityId(),
            itemIds: [itemId],
          },
        });
        AppStore.get().actionMenuStore.popStack();
        if (menuState.type === ActionMenuScreenType.ItemSelected) {
          // converting to shards from the inventory nessecitates going back two
          // stacked menus since we go itemSelected -> confirmShard and now that the item is
          // shards it doesn't make sense we would have it selected
          AppStore.get().actionMenuStore.popStack();
        }

        AppStore.get().focusStore.selectItem(null);
        AppStore.get().focusStore.clearItemComparison();
      }}
    >
      Convert ({hotkeysStore.getKeybindString(buttonType)})
    </ActionMenuTopButton>
  );
}

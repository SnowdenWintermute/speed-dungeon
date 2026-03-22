import { useClientApplication } from "@/hooks/create-client-application-context";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";
import { observer } from "mobx-react-lite";
import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { ActionMenuScreenPool } from "@/mobx-stores/action-menu/menu-state-pool";
import { ActionMenuScreenType } from "../menu-state-type";

export const VIEW_LOOT_BUTTON_TEXT = ``;

export const ViewItemsOnGroundButton = observer(() => {
  const { gameStore, focusStore, hotkeysStore } = AppStore.get();
  const partyResult = gameStore.getExpectedParty();

  const buttonType = HotkeyButtonTypes.ViewItemsOnGround;

  const hotkeys = hotkeysStore.getKeybind(buttonType);
  const hotkeyString = hotkeysStore.getKeybindString(buttonType);

  const itemsCount = partyResult.currentRoom.inventory.getItems().length;
  if (itemsCount === 0) return <div id="" />;

  return (
    <ActionMenuTopButton
      hotkeys={hotkeys}
      handleClick={() => {
        focusStore.combatantAbilities.clear();
        AppStore.get().actionMenuStore.pushStack(ActionMenuScreenPool.get(ActionMenuScreenType.ItemsOnGround));
      }}
    >
      Loot ({hotkeyString})
    </ActionMenuTopButton>
  );
});

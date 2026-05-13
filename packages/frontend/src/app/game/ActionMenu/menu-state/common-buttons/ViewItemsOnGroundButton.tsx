import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";
import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { ActionMenuScreenType } from "@/client-application/action-menu/screen-types";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";

export const ViewItemsOnGroundButton = observer(() => {
  const clientApplication = useClientApplication();
  const { gameContext, actionMenu, uiStore, detailableEntityFocus } = clientApplication;
  const party = gameContext.requireParty();

  const buttonType = HotkeyButtonTypes.ViewItemsOnGround;

  const hotkeys = uiStore.keybinds.getKeybind(buttonType);
  const hotkeyString = uiStore.keybinds.getKeybindString(buttonType);

  const itemsCount = party.currentRoom.inventory.getItems().length;
  if (itemsCount === 0) return <div id="" />;

  return (
    <ActionMenuTopButton
      hotkeys={hotkeys}
      handleClick={() => {
        detailableEntityFocus.combatantAbilities.clear();
        actionMenu.pushFromPool(ActionMenuScreenType.ItemsOnGround);
      }}
    >
      Loot ({hotkeyString})
    </ActionMenuTopButton>
  );
});

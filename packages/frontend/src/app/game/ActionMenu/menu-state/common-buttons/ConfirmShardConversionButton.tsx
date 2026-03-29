import { useClientApplication } from "@/hooks/create-client-application-context";
import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { ClientIntentType, Item } from "@speed-dungeon/common";
import { HotkeyButtonTypes } from "@speed-dungeon/client-application/src/ui/keybind-config";
import { ActionMenuScreenType } from "@speed-dungeon/client-application/src/action-menu/screen-types";

interface Props {
  item: Item;
  screenType: ActionMenuScreenType.ItemSelected | ActionMenuScreenType.ConfimConvertToShards;
}

export function ConfirmShardConversionButton({ item, screenType }: Props) {
  const clientApplication = useClientApplication();
  const { combatantFocus, uiStore, gameClientRef, actionMenu, detailableEntityFocus } =
    clientApplication;
  const { keybinds } = uiStore;

  const focusedCharacter = combatantFocus.requireFocusedCharacter();
  const itemId = item.entityProperties.id;
  const buttonType = HotkeyButtonTypes.Confirm;
  const shouldBeDisabled = !combatantFocus.clientUserControlsFocusedCombatant();

  return (
    <ActionMenuTopButton
      disabled={shouldBeDisabled}
      hotkeys={keybinds.getKeybind(buttonType)}
      handleClick={() => {
        gameClientRef.get().dispatchIntent({
          type: ClientIntentType.ConvertItemsToShards,
          data: {
            characterId: focusedCharacter.getEntityId(),
            itemIds: [itemId],
          },
        });
        actionMenu.popStack();
        if (screenType === ActionMenuScreenType.ItemSelected) {
          actionMenu.popStack();
        }
        detailableEntityFocus.selectItem(null);
        detailableEntityFocus.clearItemComparison();
      }}
    >
      Convert ({keybinds.getKeybindString(buttonType)})
    </ActionMenuTopButton>
  );
}

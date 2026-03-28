import { useClientApplication } from "@/hooks/create-client-application-context";
import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { ClientIntentType } from "@speed-dungeon/common";
import { ConfirmConvertToShardsActionMenuScreen } from "@/client-application/action-menu/screens/convert-to-shards-confirm";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";
import { ActionMenuScreenType } from "@/client-application/action-menu/screen-types";

interface Props {
  menuState: ConfirmConvertToShardsActionMenuScreen;
}

export function ConfirmShardConversionButton(props: Props) {
  const { menuState } = props;
  const clientApplication = useClientApplication();
  const { combatantFocus, uiStore, gameClientRef, actionMenu, detailableEntityFocus } =
    clientApplication;
  const { keybinds } = uiStore;

  const focusedCharacter = combatantFocus.requireFocusedCharacter();
  const itemId = menuState.item.entityProperties.id;
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
        if (menuState.type === ActionMenuScreenType.ItemSelected) {
          // converting to shards from the inventory nessecitates going back two
          // stacked menus since we go itemSelected -> confirmShard and now that the item is
          // shards it doesn't make sense we would have it selected
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

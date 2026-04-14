import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { useClientApplication } from "@/hooks/create-client-application-context";
import {
  AbilityTreeAbility,
  ClientIntentType,
  cloneAbilityTreeAbility,
} from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";
import { toJS } from "mobx";

interface Props {
  ability: AbilityTreeAbility;
}

export const AllocateAbilityPointButton = observer((props: Props) => {
  const { ability } = props;
  const clientApplication = useClientApplication();
  const { uiStore, gameClientRef, combatantFocus } = clientApplication;

  const buttonType = HotkeyButtonTypes.AllocateAbilityPoint;
  const hotkeyList = uiStore.keybinds.getKeybind(buttonType);

  const focusedCharacter = combatantFocus.requireFocusedCharacter();

  const { combatantProperties } = focusedCharacter;

  const { canAllocate } = combatantProperties.abilityProperties.canAllocateAbilityPoint(ability);

  return (
    <ActionMenuTopButton
      disabled={!canAllocate}
      hotkeys={hotkeyList}
      handleClick={() => {
        gameClientRef.get().dispatchIntent({
          type: ClientIntentType.AllocateAbilityPoint,
          data: {
            characterId: focusedCharacter.getEntityId(),
            ability: cloneAbilityTreeAbility(ability),
          },
        });
      }}
    >
      <div className="flex justify-between h-full w-full pr-2">
        <div className="flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis flex-1">
          Allocate point ({uiStore.keybinds.getKeybindString(buttonType)})
        </div>
      </div>
    </ActionMenuTopButton>
  );
});

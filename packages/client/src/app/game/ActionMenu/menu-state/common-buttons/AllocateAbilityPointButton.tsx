import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { AppStore } from "@/mobx-stores/app-store";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";
import { websocketConnection } from "@/singletons/websocket-connection";
import { AbilityTreeAbility, ClientToServerEvent } from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";

interface Props {
  ability: AbilityTreeAbility;
}

export const AllocateAbilityPointButton = observer((props: Props) => {
  const { ability } = props;

  const { hotkeys } = AppStore.get();
  const buttonType = HotkeyButtonTypes.AllocateAbilityPoint;
  const hotkeyList = hotkeys.getKeybind(buttonType);

  const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();

  const { combatantProperties } = focusedCharacter;

  const { canAllocate } = combatantProperties.abilityProperties.canAllocateAbilityPoint(ability);

  return (
    <ActionMenuTopButton
      disabled={!canAllocate}
      hotkeys={hotkeyList}
      handleClick={() => {
        websocketConnection.emit(ClientToServerEvent.AllocateAbilityPoint, {
          characterId: focusedCharacter.getEntityId(),
          ability,
        });
      }}
    >
      <div className="flex justify-between h-full w-full pr-2">
        <div className="flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis flex-1">
          Allocate point ({hotkeys.getKeybindString(buttonType)})
        </div>
      </div>
    </ActionMenuTopButton>
  );
});

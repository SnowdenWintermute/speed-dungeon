import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { useGameStore } from "@/stores/game-store";
import { ClientToServerEvent, CombatantProperties, EntityId } from "@speed-dungeon/common";
import React from "react";
import HoverableTooltipWrapper from "../components/atoms/HoverableTooltipWrapper";
import { websocketConnection } from "@/singletons/websocket-connection";
import setFocusedCharacter from "@/utils/set-focused-character";
import { AssigningAttributePointsMenuState } from "./ActionMenu/menu-state/assigning-attribute-points";
import { MenuStateType } from "./ActionMenu/menu-state";

export const toggleAssignAttributesHotkey = HOTKEYS.MAIN_2;
const buttonText = `Assign attributes (${letterFromKeyCode(toggleAssignAttributesHotkey)})`;

export default function UnspentAttributesButton({
  entityId,
  combatantProperties,
}: {
  entityId: EntityId;
  combatantProperties: CombatantProperties;
}) {
  if (combatantProperties.unspentAttributePoints < 1) return <></>;
  const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
  if (focusedCharacterResult instanceof Error) return <></>;
  const mutateGameState = useGameStore().mutateState;

  function handleUnspentAttributesButtonClick() {
    websocketConnection.emit(ClientToServerEvent.SelectCombatAction, {
      characterId: entityId,
      combatActionNameOption: null,
    });

    const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
    if (focusedCharacterResult instanceof Error) return;

    if (
      useGameStore.getState().getCurrentMenu().type === MenuStateType.AssignAttributePoints &&
      entityId === focusedCharacterResult.entityProperties.id
    ) {
      mutateGameState((store) => {
        store.stackedMenuStates.pop();
      });
    } else {
      setFocusedCharacter(entityId);
      mutateGameState((store) => {
        store.stackedMenuStates = [new AssigningAttributePointsMenuState()];
      });
    }
  }

  return (
    <HoverableTooltipWrapper tooltipText={buttonText}>
      <button
        onClick={handleUnspentAttributesButtonClick}
        className="bg-ffxipink h-5 w-5 border border-slate-400 text-slate-950 text-lg leading-3 ml-1"
      >
        {"+"}
      </button>
    </HoverableTooltipWrapper>
  );
}

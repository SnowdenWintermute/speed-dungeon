import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { ClientToServerEvent, CombatantProperties, EntityId } from "@speed-dungeon/common";
import React from "react";
import HoverableTooltipWrapper from "../components/atoms/HoverableTooltipWrapper";
import { websocketConnection } from "@/singletons/websocket-connection";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStateType } from "./ActionMenu/menu-state/menu-state-type";
import { MenuStatePool } from "@/mobx-stores/action-menu/menu-state-pool";
import { observer } from "mobx-react-lite";

export const toggleAssignAttributesHotkey = HOTKEYS.MAIN_2;
const buttonText = `Assign attributes (${letterFromKeyCode(toggleAssignAttributesHotkey)})`;

export const UnspentAttributesButton = observer(
  ({
    entityId,
    combatantProperties,
  }: {
    entityId: EntityId;
    combatantProperties: CombatantProperties;
  }) => {
    if (combatantProperties.attributeProperties.getUnspentPoints() < 1) return <></>;

    const { actionMenuStore, gameStore } = AppStore.get();

    function handleUnspentAttributesButtonClick() {
      websocketConnection.emit(ClientToServerEvent.SelectCombatAction, {
        characterId: entityId,
        actionAndRankOption: null,
      });

      const focusedCharacter = gameStore.getExpectedFocusedCharacter();

      if (
        actionMenuStore.currentMenuIsType(MenuStateType.AssignAttributePoints) &&
        entityId === focusedCharacter.entityProperties.id
      ) {
        actionMenuStore.popStack();
      } else {
        gameStore.setFocusedCharacter(entityId);
        actionMenuStore.replaceStack([MenuStatePool.get(MenuStateType.AssignAttributePoints)]);
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
);

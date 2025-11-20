import { ClientToServerEvent, CombatantProperties, EntityId } from "@speed-dungeon/common";
import React from "react";
import HoverableTooltipWrapper from "../components/atoms/HoverableTooltipWrapper";
import { websocketConnection } from "@/singletons/websocket-connection";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStateType } from "./ActionMenu/menu-state/menu-state-type";
import { MenuStatePool } from "@/mobx-stores/action-menu/menu-state-pool";
import { observer } from "mobx-react-lite";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";

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
      gameStore.setFocusedCharacter(entityId);
      const focusedCharacter = gameStore.getExpectedFocusedCharacter();

      websocketConnection.emit(ClientToServerEvent.SelectCombatAction, {
        characterId: entityId,
        actionAndRankOption: null,
      });

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

    // the actual hotkey button is in the base action menu to avoid
    // the hotkey being available when inventory is open and other times
    // where it would collide with using the hotkey for dropping shards
    const buttonType = HotkeyButtonTypes.ToggleAssignAttributesMenu;
    const { hotkeysStore } = AppStore.get();

    return (
      <HoverableTooltipWrapper
        tooltipText={`Assign attributes (${hotkeysStore.getKeybindString(buttonType)})`}
      >
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

import { ClientIntentType, CombatantId, CombatantProperties } from "@speed-dungeon/common";
import React from "react";
import HoverableTooltipWrapper from "../components/atoms/HoverableTooltipWrapper";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { ActionMenuScreenType } from "./ActionMenu/menu-state/menu-state-type";
import { ActionMenuScreenPool } from "@/mobx-stores/action-menu/menu-state-pool";
import { observer } from "mobx-react-lite";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";
import { gameClientSingleton } from "@/singletons/lobby-client";

export const UnspentAttributesButton = observer(
  ({
    entityId,
    combatantProperties,
  }: {
    entityId: CombatantId;
    combatantProperties: CombatantProperties;
  }) => {
    if (combatantProperties.attributeProperties.getUnspentPoints() < 1) return <></>;

    const { actionMenuStore, gameStore } = AppStore.get();

    function handleUnspentAttributesButtonClick() {
      const previouslyFocusedCharacterId = gameStore.getExpectedFocusedCharacterId();

      if (gameStore.clientUserControlsFocusedCombatant()) {
        gameClientSingleton.get().dispatchIntent({
          type: ClientIntentType.SelectCombatAction,
          data: {
            characterId: previouslyFocusedCharacterId,
            actionAndRankOption: null,
          },
        });
      }

      gameStore.setFocusedCharacter(entityId);

      if (
        actionMenuStore.currentMenuIsType(ActionMenuScreenType.AssignAttributePoints) &&
        entityId === previouslyFocusedCharacterId
      ) {
        actionMenuStore.popStack();
      } else {
        gameStore.setFocusedCharacter(entityId);
        actionMenuStore.replaceStack([ActionMenuScreenPool.get(ActionMenuScreenType.AssignAttributePoints)]);
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

import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { AppStore } from "@/mobx-stores/app-store";
import { websocketConnection } from "@/singletons/websocket-connection";
import {
  ActionRank,
  ArrayUtils,
  ClientToServerEvent,
  COMBAT_ACTION_NAME_STRINGS,
  COMBAT_ACTIONS,
  CombatActionName,
  CombatantActionState,
} from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import React from "react";

interface Props {
  actionName: CombatActionName;
  actionStateAndSelectedLevel?: {
    actionStateOption: undefined | CombatantActionState;
    selectedLevelOption: null | number;
  };
}

export const ActionDetailsTitleBar = observer((props: Props) => {
  const { actionName, actionStateAndSelectedLevel } = props;
  const actionStateOption = actionStateAndSelectedLevel?.actionStateOption;
  const selectedLevelOption = actionStateAndSelectedLevel?.selectedLevelOption;
  const action = COMBAT_ACTIONS[actionName];

  const { gameStore } = AppStore.get();
  const focusedCharacter = gameStore.getExpectedFocusedCharacter();

  const inBattle = gameStore.getExpectedParty().combatantManager.monstersArePresent();

  function handleSelectActionLevel(level: ActionRank) {
    websocketConnection.emit(ClientToServerEvent.SelectCombatActionLevel, {
      characterId: focusedCharacter.getEntityId(),
      actionLevel: level,
    });
  }

  const maxRankToShow = action.selectableRankLimit || actionStateOption?.level;

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between">
        <span>{COMBAT_ACTION_NAME_STRINGS[actionName]}</span>
        {(actionStateOption?.level || 0) > 1 && (
          <div className="flex">
            <span className="mr-1">{(actionStateOption?.level ?? 0) > 1 ? "Ranks" : "Rank"}</span>
            {actionStateAndSelectedLevel && (
              <ul className="flex">
                {ArrayUtils.createFilledWithSequentialNumbers(maxRankToShow || 0, 1).map(
                  (rankUncast) => {
                    const rank = rankUncast as ActionRank;
                    const costs = action.costProperties.getResourceCosts(
                      focusedCharacter,
                      !!inBattle,
                      rank
                    );
                    const unmet =
                      focusedCharacter.combatantProperties.resources.getUnmetCostResourceTypes(
                        costs || {}
                      );

                    return (
                      <li key={actionName + rank} className="mr-1 last:mr-0">
                        <HotkeyButton
                          hotkeys={[`Digit${rank.toString()}`, `Numpad${rank.toString()}`]}
                          disabled={selectedLevelOption === null || !!unmet.length}
                          onClick={() => handleSelectActionLevel(rank)}
                        >
                          <div
                            className={`h-5 w-5 flex items-center justify-center border border-slate-400 
                          ${rank === selectedLevelOption ? "bg-slate-950" : "bg-slate-700"}
                          ${!!unmet.length && "opacity-50"}`}
                          >
                            <span>{rank}</span>
                          </div>
                        </HotkeyButton>
                      </li>
                    );
                  }
                )}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="mb-1 mt-1 h-[1px] bg-slate-400" />
    </div>
  );
});

import HotkeyButton from "@/app/components/atoms/HotkeyButton";
import { websocketConnection } from "@/singletons/websocket-connection";
import { useGameStore } from "@/stores/game-store";
import {
  ArrayUtils,
  ClientToServerEvent,
  COMBAT_ACTION_NAME_STRINGS,
  COMBAT_ACTIONS,
  CombatActionName,
  CombatantActionState,
  getUnmetCostResourceTypes,
} from "@speed-dungeon/common";
import React from "react";

interface Props {
  actionName: CombatActionName;
  actionStateAndSelectedLevel?: {
    actionStateOption: undefined | CombatantActionState;
    selectedLevelOption: null | number;
  };
}

export default function ActionDetailsTitleBar(props: Props) {
  const { actionName, actionStateAndSelectedLevel } = props;
  const actionStateOption = actionStateAndSelectedLevel?.actionStateOption;
  const selectedLevelOption = actionStateAndSelectedLevel?.selectedLevelOption;
  const action = COMBAT_ACTIONS[actionName];

  const focusedCharacterId = useGameStore.getState().focusedCharacterId;
  const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
  const inBattle = useGameStore.getState().getCurrentBattleId();

  if (focusedCharacterResult instanceof Error) return <>{focusedCharacterResult}</>;

  function handleSelectActionLevel(level: number) {
    websocketConnection.emit(ClientToServerEvent.SelectCombatActionLevel, {
      characterId: focusedCharacterId,
      actionLevel: level,
    });
  }

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between">
        <span>{COMBAT_ACTION_NAME_STRINGS[actionName]}</span>
        {(actionStateOption?.level || 0) > 1 && (
          <div className="flex">
            <span className="mr-1">{(actionStateOption?.level ?? 0) > 1 ? "Ranks" : "Rank"}</span>
            {actionStateAndSelectedLevel && (
              <ul className="flex">
                {ArrayUtils.createFilledWithSequentialNumbers(actionStateOption?.level || 0, 1).map(
                  (item) => {
                    const costs = action.costProperties.getResourceCosts(
                      focusedCharacterResult,
                      !!inBattle,
                      item
                    );
                    const unmet = getUnmetCostResourceTypes(
                      focusedCharacterResult.combatantProperties,
                      costs || {}
                    );

                    return (
                      <li key={actionName + item} className="mr-1 last:mr-0">
                        <HotkeyButton
                          hotkeys={[`Digit${item.toString()}`, `Numpad${item.toString()}`]}
                          disabled={selectedLevelOption === null || !!unmet.length}
                          onClick={() => handleSelectActionLevel(item)}
                        >
                          <div
                            className={`h-5 w-5 flex items-center justify-center border border-slate-400 
                          ${item === selectedLevelOption ? "bg-slate-950" : "bg-slate-700"}
                          ${!!unmet.length && "opacity-50"}`}
                          >
                            <span>{item}</span>
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
}

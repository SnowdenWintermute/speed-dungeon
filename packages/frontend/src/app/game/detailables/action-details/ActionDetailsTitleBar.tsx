import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { GameClient } from "@/client-application/clients/game";
import { useClientApplication } from "@/hooks/create-client-application-context";
import {
  ActionRank,
  ArrayUtils,
  ClientIntentType,
  COMBAT_ACTION_NAME_STRINGS,
  COMBAT_ACTIONS,
  CombatActionName,
  CombatantActionState,
  CombatantId,
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

export function handleSelectActionLevel(
  gameClient: GameClient,
  characterId: CombatantId,
  actionRank: ActionRank
) {
  gameClient.dispatchIntent({
    type: ClientIntentType.SelectCombatActionRank,
    data: {
      characterId,
      actionRank,
    },
  });
}

export const ActionDetailsTitleBar = observer((props: Props) => {
  const { actionName, actionStateAndSelectedLevel } = props;
  const actionStateOption = actionStateAndSelectedLevel?.actionStateOption;
  const selectedLevelOption = actionStateAndSelectedLevel?.selectedLevelOption;
  const action = COMBAT_ACTIONS[actionName];

  const { gameClientRef, combatantFocus } = useClientApplication();
  const { combatant, party } = combatantFocus.requireFocusedCharacterContext();

  const inBattle = party.combatantManager.monstersArePresent();

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
                      combatant,
                      !!inBattle,
                      rank
                    );
                    const unmet = combatant.combatantProperties.resources.getUnmetCostResourceTypes(
                      costs || {}
                    );

                    return (
                      <li key={actionName + rank} className="mr-1 last:mr-0">
                        <HotkeyButton
                          hotkeys={[`Digit${rank.toString()}`, `Numpad${rank.toString()}`]}
                          disabled={selectedLevelOption === null || !!unmet.length}
                          onClick={() =>
                            handleSelectActionLevel(
                              gameClientRef.get(),
                              combatant.getEntityId(),
                              rank
                            )
                          }
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

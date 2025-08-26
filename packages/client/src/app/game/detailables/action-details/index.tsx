import {
  ACTION_PAYABLE_RESOURCE_STRINGS,
  COMBAT_ACTIONS,
  COMBAT_ACTION_USABLITY_CONTEXT_STRINGS,
  CombatActionName,
  CombatActionUsabilityContext,
  getUnmetCostResourceTypes,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import React from "react";
import { useGameStore } from "@/stores/game-store";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import ActionDetailsTitleBar from "./ActionDetailsTitleBar";

interface Props {
  actionName: CombatActionName;
  hideTitle?: boolean;
}

export default function ActionDetails({ actionName, hideTitle }: Props) {
  const partyResult = useGameStore().getParty();
  if (partyResult instanceof Error) return <div>{partyResult.message}</div>;
  const party = partyResult;
  const focusedCharacterResult = useGameStore().getFocusedCharacter();
  if (focusedCharacterResult instanceof Error) return <div>{focusedCharacterResult.message}</div>;
  const { combatantProperties } = focusedCharacterResult;
  const { abilityProperties } = combatantProperties;
  const actionStateOption = abilityProperties.ownedActions[actionName];
  const selectedLevelOption = combatantProperties.selectedActionLevel;

  const inCombat = !!Object.values(party.currentRoom.monsters).length;

  const action = COMBAT_ACTIONS[actionName];
  const costs =
    action.costProperties.getResourceCosts(
      combatantProperties,
      inCombat,
      selectedLevelOption || 1
    ) || {};
  const unmetCosts = costs ? getUnmetCostResourceTypes(combatantProperties, costs) : [];
  const { usabilityContext } = action.targetingProperties;

  const notInUsableContext =
    (!inCombat && usabilityContext === CombatActionUsabilityContext.InCombat) ||
    (inCombat && usabilityContext === CombatActionUsabilityContext.OutOfCombat);

  return (
    <div className="flex flex-col pointer-events-auto" style={{ flex: `1 1 1px` }}>
      {!hideTitle && (
        <ActionDetailsTitleBar
          actionName={actionName}
          actionStateAndSelectedLevel={{ actionStateOption, selectedLevelOption }}
        />
      )}
      {
        <div className="flex-grow overflow-auto mr-2">
          <div className="mb-2 last:mb-0">{action.description}</div>
          {actionStateOption && actionStateOption.cooldown && (
            <div
              className={
                actionStateOption.cooldown.current !== 0 ? UNMET_REQUIREMENT_TEXT_COLOR : ""
              }
            >
              Cooldown {actionStateOption.cooldown.current}/{actionStateOption.cooldown.max}
            </div>
          )}
          {notInUsableContext && (
            <div
              className={UNMET_REQUIREMENT_TEXT_COLOR}
            >{`Usable ${COMBAT_ACTION_USABLITY_CONTEXT_STRINGS[usabilityContext]}`}</div>
          )}
          {iterateNumericEnumKeyedRecord(costs)
            .filter(([resource, price]) => unmetCosts.includes(resource))
            .map(([resource, price]) => (
              <div
                className={UNMET_REQUIREMENT_TEXT_COLOR}
                key={ACTION_PAYABLE_RESOURCE_STRINGS[resource]}
              >
                Costs {Math.abs(price)} {ACTION_PAYABLE_RESOURCE_STRINGS[resource]}
              </div>
            ))}
        </div>
      }
    </div>
  );
}

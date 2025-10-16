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
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import { ActionDetailsTitleBar } from "./ActionDetailsTitleBar";
import { AppStore } from "@/mobx-stores/app-store";
import { observer } from "mobx-react-lite";

interface Props {
  actionName: CombatActionName;
  consumableDescriptionOption?: string;
  hideTitle?: boolean;
}

export const ActionDetails = observer(
  ({ actionName, consumableDescriptionOption, hideTitle }: Props) => {
    const party = AppStore.get().gameStore.getExpectedParty();
    const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
    const { combatantProperties } = focusedCharacter;
    const { abilityProperties } = combatantProperties;
    const actionStateOption = abilityProperties.ownedActions[actionName];
    const selectedLevelOption =
      focusedCharacter.getTargetingProperties().getSelectedActionAndRank()?.rank || 1;

    const inCombat = party.combatantManager.monstersArePresent();

    const action = COMBAT_ACTIONS[actionName];
    const costs =
      action.costProperties.getResourceCosts(focusedCharacter, inCombat, selectedLevelOption) || {};
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
            {consumableDescriptionOption ? (
              <div className="mb-2 last:mb-0">{consumableDescriptionOption}</div>
            ) : (
              <div className="mb-2 last:mb-0">{action.description}</div>
            )}

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
);

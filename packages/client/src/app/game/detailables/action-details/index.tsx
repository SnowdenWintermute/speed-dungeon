import {
  ACTION_PAYABLE_RESOURCE_STRINGS,
  AbilityType,
  ActionRank,
  COMBAT_ACTIONS,
  COMBAT_ACTION_USABLITY_CONTEXT_STRINGS,
  CombatActionName,
  CombatActionUsabilityContext,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import React from "react";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client-consts";
import { ActionDetailsTitleBar } from "./ActionDetailsTitleBar";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";

interface Props {
  actionName: CombatActionName;
  consumableDescriptionOption?: string;
  hideTitle?: boolean;
}

export const ActionDetails = observer(
  ({ actionName, consumableDescriptionOption, hideTitle }: Props) => {
    const clientApplication = useClientApplication();
    const { gameContext, combatantFocus } = clientApplication;

    const party = gameContext.requireParty();
    const focusedCharacter = combatantFocus.requireFocusedCharacter();
    const { combatantProperties } = focusedCharacter;
    const { abilityProperties } = combatantProperties;
    const actionStateOption = abilityProperties.getOwnedActionOption(actionName);
    const selectedLevelOption =
      focusedCharacter.getTargetingProperties().getSelectedActionAndRank()?.rank ||
      (1 as ActionRank);

    const inCombat = party.combatantManager.monstersArePresent();

    const action = COMBAT_ACTIONS[actionName];
    const costs =
      action.costProperties.getResourceCosts(focusedCharacter, inCombat, selectedLevelOption) || {};
    const unmetCosts = costs ? combatantProperties.resources.getUnmetCostResourceTypes(costs) : [];
    const { usabilityContext } = action.targetingProperties;

    const notInUsableContext =
      (!inCombat && usabilityContext === CombatActionUsabilityContext.InCombat) ||
      (inCombat && usabilityContext === CombatActionUsabilityContext.OutOfCombat);

    const maxRank = focusedCharacter.getCombatantProperties().abilityProperties.getAbilityRank({
      type: AbilityType.Action,
      actionName,
    });

    const customRequirementsGetterOption = action.costProperties.getMeetsCustomRequirements;
    let customRequirementsNotMetReason = "";
    if (customRequirementsGetterOption) {
      const meetsCustomRequirements = customRequirementsGetterOption(focusedCharacter, party);
      if (meetsCustomRequirements.reasonDoesNot) {
        customRequirementsNotMetReason = meetsCustomRequirements.reasonDoesNot;
      }
    }

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
            {customRequirementsNotMetReason && (
              <div className={UNMET_REQUIREMENT_TEXT_COLOR}>{customRequirementsNotMetReason}</div>
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

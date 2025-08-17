import {
  ACTION_PAYABLE_RESOURCE_STRINGS,
  ActionPayableResource,
  COMBAT_ACTIONS,
  COMBAT_ACTION_NAME_STRINGS,
  COMBAT_ACTION_USABLITY_CONTEXT_STRINGS,
  CombatActionComponent,
  CombatActionName,
  CombatActionUsabilityContext,
  Combatant,
  CombatantProperties,
  EQUIPMENT_TYPE_STRINGS,
  TARGETING_SCHEME_STRINGS,
  TARGET_CATEGORY_STRINGS,
  createArrayFilledWithSequentialNumbers,
  getUnmetCostResourceTypes,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import React, { ReactNode } from "react";
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
  const focusedCharacter = focusedCharacterResult;
  const actionStateOption =
    focusedCharacter.combatantProperties.abilityProperties.ownedActions[actionName];
  const selectedLevelOption = focusedCharacter.combatantProperties.selectedActionLevel;

  const inCombat = !!Object.values(party.currentRoom.monsters).length;

  const action = COMBAT_ACTIONS[actionName];
  const costs = action.costProperties.getResourceCosts(
    focusedCharacter.combatantProperties,
    inCombat,
    selectedLevelOption || 1
  );
  const { usabilityContext } = action.targetingProperties;

  const targetingSchemesText = formatTargetingSchemes(focusedCharacter, action);

  return (
    <div className="flex flex-col pointer-events-auto" style={{ flex: `1 1 1px` }}>
      {!hideTitle && (
        <ActionDetailsTitleBar
          actionName={actionName}
          actionStateAndSelectedLevel={{ actionStateOption, selectedLevelOption }}
        />
      )}
      {
        // <div className="flex-grow overflow-auto mr-2">
        // <div>{action.description}</div>
        // <div>{`Valid targets: ${TARGET_CATEGORY_STRINGS[action.targetingProperties.validTargetCategories]}`}</div>
        // <div>{`Targeting schemes: ${targetingSchemesText}`}</div>
        // {costs && (
        //   <ActionCostsDisplay
        //   actionName={actionName}
        //   user={focusedCharacter.combatantProperties}
        //   inCombat={inCombat}
        //   />
        // )}
        // <div
        // className={
        //   !inCombat && usabilityContext === CombatActionUsabilityContext.InCombat
        //     ? UNMET_REQUIREMENT_TEXT_COLOR
        //     : ""
        // }
        // >{`Usable ${COMBAT_ACTION_USABLITY_CONTEXT_STRINGS[usabilityContext]}`}</div>
        // <RequiredEquipmentDisplay action={action} user={focusedCharacter.combatantProperties} />
        // {actionStateOption && actionStateOption.cooldown && (
        //   <div
        //   className={actionStateOption.cooldown.current !== 0 ? UNMET_REQUIREMENT_TEXT_COLOR : ""}
        //   >
        //   Cooldown {actionStateOption.cooldown.current}/{actionStateOption.cooldown.max}
        //   </div>
        // )}
        // </div>
      }
    </div>
  );
}

// function RequiredEquipmentDisplay(props: {
//   action: CombatActionComponent;
//   user: CombatantProperties;
// }) {
//   const { action, user } = props;
//   const toDisplay: ReactNode[] = [];
//   const { getRequiredEquipmentTypeOptions } = action.targetingProperties;
//   const
//   if (getRequiredEquipmentTypeOptions.length === 0) return toDisplay;
//   const isWearingRequiredEquipment = CombatantProperties.isWearingRequiredEquipmentToUseAction(
//     user,
//     action.name
//   );

//   for (const equipmentType of requiredEquipmentTypeOptions) {
//     toDisplay.push(EQUIPMENT_TYPE_STRINGS[equipmentType].toLowerCase());
//   }
//   const requirementNotMetClass = isWearingRequiredEquipment ? "" : UNMET_REQUIREMENT_TEXT_COLOR;
//   return <div className={requirementNotMetClass}>Must equip {toDisplay}</div>;
// }

function ActionCostsDisplay(props: {
  user: CombatantProperties;
  actionName: CombatActionName;
  inCombat: boolean;
}) {
  const { user, actionName, inCombat } = props;
  const action = COMBAT_ACTIONS[actionName];
  const actionStateOption = user.abilityProperties.ownedActions[actionName];

  const userIsSelectingThisAction = user.selectedCombatAction === actionName;
  const { selectedActionLevel } = user;

  const costsByLevel: (Partial<Record<ActionPayableResource, number>> | null)[] = [];

  for (const level of createArrayFilledWithSequentialNumbers(actionStateOption?.level || 3, 1)) {
    const costs = action.costProperties.getResourceCosts(user, inCombat, level);
    costsByLevel.push(costs);
  }

  const costsDisplay = costsByLevel.map((costs, i) => {
    if (costs === null) return;
    const rank = i + 1;

    const unmet = getUnmetCostResourceTypes(user, costs);

    let userSelectedStyles = "";
    if (rank === selectedActionLevel && userIsSelectingThisAction)
      userSelectedStyles = "underline ";

    return (
      <li className={`flex mr-1 last:mr-0 ${userSelectedStyles} px-1`} key={i}>
        <ul>
          {iterateNumericEnumKeyedRecord(costs).map(([resource, cost]) => {
            let unmetStyles = "";
            if (unmet.includes(resource)) unmetStyles += UNMET_REQUIREMENT_TEXT_COLOR;
            return (
              <li key={resource} className={unmetStyles}>
                <span>{ACTION_PAYABLE_RESOURCE_STRINGS[resource]}: </span>
                <span>{Math.abs(cost)}</span>
              </li>
            );
          })}
        </ul>
      </li>
    );
  });

  return <ul className="flex">{costsDisplay}</ul>;
}

function formatTargetingSchemes(user: Combatant, action: CombatActionComponent) {
  const { selectedActionLevel } = user.combatantProperties;
  return action.targetingProperties
    .getTargetingSchemes(selectedActionLevel || 1)
    .map((targetingScheme, i) => TARGETING_SCHEME_STRINGS[targetingScheme])
    .join(", ");
}

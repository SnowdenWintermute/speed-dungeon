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
  CombatantEquipment,
  CombatantProperties,
  EQUIPMENT_TYPE_STRINGS,
  Equipment,
  EquipmentType,
  TARGETING_SCHEME_STRINGS,
  TARGET_CATEGORY_STRINGS,
  getUnmetCostResourceTypes,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import React, { ReactNode } from "react";
import { useGameStore } from "@/stores/game-store";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";

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

  const inCombat = Object.values(party.currentRoom.monsters).length;

  const action = COMBAT_ACTIONS[actionName];
  const costs = action.costProperties.getResourceCosts(focusedCharacter.combatantProperties);
  const { usabilityContext } = action.targetingProperties;

  const targetingSchemesText = formatTargetingSchemes(focusedCharacter, action);

  return (
    <div className="flex flex-col pointer-events-auto" style={{ flex: `1 1 1px` }}>
      {!hideTitle && (
        <>
          <span>{COMBAT_ACTION_NAME_STRINGS[action.name]}</span>
          <div className="mb-1 mt-1 h-[1px] bg-slate-400" />
        </>
      )}
      <div className="flex-grow overflow-auto mr-2">
        <div>{action.description}</div>
        <div>{`Valid targets: ${TARGET_CATEGORY_STRINGS[action.targetingProperties.validTargetCategories]}`}</div>
        <div>{`Targeting schemes: ${targetingSchemesText}`}</div>
        {costs && <ActionCostsDisplay costs={costs} user={focusedCharacter.combatantProperties} />}
        <div
          className={
            !inCombat && usabilityContext === CombatActionUsabilityContext.InCombat
              ? UNMET_REQUIREMENT_TEXT_COLOR
              : ""
          }
        >{`Usable ${COMBAT_ACTION_USABLITY_CONTEXT_STRINGS[usabilityContext]}`}</div>
        <RequiredEquipmentDisplay action={action} user={focusedCharacter.combatantProperties} />
      </div>
    </div>
  );
}

function RequiredEquipmentDisplay(props: {
  action: CombatActionComponent;
  user: CombatantProperties;
}) {
  const { action, user } = props;
  const toDisplay: ReactNode[] = [];
  const { requiredEquipmentTypeOptions } = action.targetingProperties;
  if (requiredEquipmentTypeOptions.length === 0) return toDisplay;
  const isWearingRequiredEquipment = CombatantProperties.isWearingRequiredEquipmentToUseAction(
    user,
    action.name
  );

  for (const equipmentType of requiredEquipmentTypeOptions) {
    toDisplay.push(EQUIPMENT_TYPE_STRINGS[equipmentType].toLowerCase());
  }
  const requirementNotMetClass = isWearingRequiredEquipment ? "" : UNMET_REQUIREMENT_TEXT_COLOR;
  return <div className={requirementNotMetClass}>Must equip {toDisplay}</div>;
}

function ActionCostsDisplay(props: {
  user: CombatantProperties;
  costs: Partial<Record<ActionPayableResource, number>>;
}) {
  const { user, costs } = props;
  const unmet = getUnmetCostResourceTypes(user, costs);

  return (
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
  );
}

function formatTargetingSchemes(user: Combatant, action: CombatActionComponent) {
  return action.targetingProperties
    .getTargetingSchemes(user)
    .map((targetingScheme, i) => TARGETING_SCHEME_STRINGS[targetingScheme])
    .join(", ");
}

import {
  AdventuringParty,
  CombatAction,
  CombatActionType,
  CombatantAbility,
  ERROR_MESSAGES,
  ItemPropertiesType,
  formatAbilityName,
  formatActionUsabilityContext,
  formatConsumableType,
  formatTargetCategories,
  formatTargetingScheme,
} from "@speed-dungeon/common";
import React from "react";
import AbilityDetails from "./AbilityDetails";
import { getCombatActionProperties } from "@speed-dungeon/common";
import { useGameStore } from "@/stores/game-store";

interface Props {
  combatAction: CombatAction;
  hideTitle: boolean;
}

export default function ActionDetails({ combatAction, hideTitle }: Props) {
  const partyResult = useGameStore().getParty();
  if (partyResult instanceof Error) return <div>{partyResult.message}</div>;
  const party = partyResult;
  const focusedCharacterResult = useGameStore().getFocusedCharacter();
  if (focusedCharacterResult instanceof Error) return <div>{focusedCharacterResult.message}</div>;
  const focusedCharacter = focusedCharacterResult;

  const combatActionPropertiesResult = getCombatActionProperties(
    party,
    combatAction,
    focusedCharacter.entityProperties.id
  );
  if (combatActionPropertiesResult instanceof Error)
    return <div>{combatActionPropertiesResult.message}</div>;
  const combatActionProperties = combatActionPropertiesResult;

  let abilityOption: null | CombatantAbility = null;
  if (combatAction.type === CombatActionType.AbilityUsed) {
    const ownedAbilityOption =
      focusedCharacter.combatantProperties.abilities[combatAction.abilityName] ?? null;
    if (!ownedAbilityOption) return <div>{ERROR_MESSAGES.ABILITIES.NOT_OWNED}</div>;
    abilityOption = ownedAbilityOption;
  }

  let targetingSchemesText = "";
  combatActionProperties.targetingSchemes.forEach((targetingScheme, i) => {
    targetingSchemesText += formatTargetingScheme(targetingScheme);
    if (i < combatActionProperties.targetingSchemes.length - 1) {
      targetingSchemesText += ", ";
    }
  });

  return (
    <div>
      {!hideTitle && (
        <>
          <span>{getCombatActionName(party, combatAction)}</span>
          <div className="mb-1 mt-1 h-[1px] bg-slate-400" />
        </>
      )}
      {abilityOption && (
        <AbilityDetails
          ability={abilityOption}
          userCombatantProperties={focusedCharacter.combatantProperties}
          combatActionProperties={combatActionProperties}
        />
      )}
      <div>{combatActionProperties.description}</div>
      <div>
        {`Valid targets: ${formatTargetCategories(combatActionProperties.validTargetCategories)}`}
      </div>
      <div>{`Targeting schemes: ${targetingSchemesText}`}</div>
      <div>{`Usable ${formatActionUsabilityContext(combatActionProperties.usabilityContext)}`}</div>
    </div>
  );
}

function getCombatActionName(party: AdventuringParty, combatAction: CombatAction) {
  let actionName = "";
  switch (combatAction.type) {
    case CombatActionType.AbilityUsed:
      actionName = formatAbilityName(combatAction.abilityName);
      break;
    case CombatActionType.ConsumableUsed:
      const itemResult = AdventuringParty.getItem(party, combatAction.itemId);
      if (itemResult instanceof Error) {
        actionName = itemResult.message;
        break;
      }
      switch (itemResult.itemProperties.type) {
        case ItemPropertiesType.Equipment:
          actionName = "Why is an equipment being used as an action";
          break;
        case ItemPropertiesType.Consumable:
          actionName = formatConsumableType(
            itemResult.itemProperties.consumableProperties.consumableType
          );
          break;
      }
  }
  return actionName;
}

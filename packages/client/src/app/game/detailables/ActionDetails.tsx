import {
  ABILITY_NAME_STRINGS,
  ActionUsableContext,
  AdventuringParty,
  COMBAT_ACTION_USABLITY_CONTEXT_STRINGS,
  CONSUMABLE_TYPE_STRINGS,
  CombatAction,
  CombatActionType,
  CombatantAbility,
  Consumable,
  ERROR_MESSAGES,
  TARGET_CATEGORY_STRINGS,
  formatTargetingScheme,
} from "@speed-dungeon/common";
import React from "react";
import AbilityDetails from "./AbilityDetails";
import { getCombatActionProperties } from "@speed-dungeon/common";
import { useGameStore } from "@/stores/game-store";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";

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

  const inCombat = Object.values(party.currentRoom.monsters).length;

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
    <div className="flex flex-col pointer-events-auto" style={{ flex: `1 1 1px` }}>
      {!hideTitle && (
        <>
          <span>{getCombatActionName(party, combatAction)}</span>
          <div className="mb-1 mt-1 h-[1px] bg-slate-400" />
        </>
      )}
      <div className="flex-grow overflow-auto">
        {abilityOption && (
          <AbilityDetails
            ability={abilityOption}
            user={focusedCharacter}
            combatActionProperties={combatActionProperties}
          />
        )}
        <div>{combatActionProperties.description}</div>
        <div>
          {`Valid targets: ${TARGET_CATEGORY_STRINGS[combatActionProperties.validTargetCategories]}`}
        </div>
        <div>{`Targeting schemes: ${targetingSchemesText}`}</div>
        <div
          className={
            !inCombat && combatActionProperties.usabilityContext === ActionUsableContext.InCombat
              ? UNMET_REQUIREMENT_TEXT_COLOR
              : ""
          }
        >{`Usable ${COMBAT_ACTION_USABLITY_CONTEXT_STRINGS[combatActionProperties.usabilityContext]}`}</div>
      </div>
    </div>
  );
}

function getCombatActionName(party: AdventuringParty, combatAction: CombatAction) {
  let actionName = "";
  switch (combatAction.type) {
    case CombatActionType.AbilityUsed:
      actionName = ABILITY_NAME_STRINGS[combatAction.abilityName];
      break;
    case CombatActionType.ConsumableUsed:
      const itemResult = AdventuringParty.getItem(party, combatAction.itemId);
      if (itemResult instanceof Error) {
        actionName = itemResult.message;
        break;
      }
      if (!(itemResult instanceof Consumable))
        actionName = "Why is an equipment being used as an action";
      else actionName = CONSUMABLE_TYPE_STRINGS[itemResult.consumableType];
  }
  return actionName;
}

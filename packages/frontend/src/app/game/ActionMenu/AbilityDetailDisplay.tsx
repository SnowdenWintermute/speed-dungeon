import React from "react";
import { observer } from "mobx-react-lite";
import {
  AbilityTreeAbility,
  AbilityType,
  ActionRank,
  AdventuringParty,
  ArrayUtils,
  COMBAT_ACTION_USABLITY_CONTEXT_STRINGS,
  Combatant,
  COMBATANT_CONDITION_DESCRIPTIONS,
  COMBATANT_CONDITION_NAME_STRINGS,
  COMBATANT_TRAIT_DESCRIPTIONS,
  CombatantConditionName,
  getAbilityTreeAbilityNameString,
} from "@speed-dungeon/common";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { COMBAT_ACTION_DESCRIPTIONS } from "@/app/game/character-sheet/ability-tree/ability-descriptions";
import { ActionDescriptionComponent } from "@/app/game/character-sheet/ability-tree/action-description";
import { ACTION_ICONS, TRAIT_ICONS } from "@/app/icons";
import Divider from "@/app/components/atoms/Divider";

interface Props {
  ability: AbilityTreeAbility;
  column: AbilityTreeAbility[];
}

export default observer(function AbilityDetailDisplay({ ability, column }: Props) {
  const clientApplication = useClientApplication();
  const focusedCharacter = clientApplication.combatantFocus.requireFocusedCharacter();
  const party = clientApplication.gameContext.requireParty();

  const conditionsToShow = getConditionsToShowDetailButtonsFor(party, ability, focusedCharacter);
  const conditionDescriptions = conditionsToShow.map((conditionName) => (
    <div key={conditionName}>
      {COMBATANT_CONDITION_NAME_STRINGS[conditionName]}:{" "}
      {COMBATANT_CONDITION_DESCRIPTIONS[conditionName]}
    </div>
  ));

  let content;
  let iconGetter;

  if (ability.type === AbilityType.Action) {
    const description = COMBAT_ACTION_DESCRIPTIONS[ability.actionName];
    iconGetter = ACTION_ICONS[ability.actionName];
    content = (
      <div>
        <div>{description.getSummary()}</div>
        <div>
          Usable {COMBAT_ACTION_USABLITY_CONTEXT_STRINGS[description.getUsabilityContext()]}
        </div>
        <div>{}</div>
        {!!conditionDescriptions.length && (
          <div>
            <Divider />
            {conditionDescriptions}
          </div>
        )}
      </div>
    );
  } else {
    iconGetter = TRAIT_ICONS[ability.traitType];
    const description = COMBATANT_TRAIT_DESCRIPTIONS[ability.traitType];
    content = <div>{description.summary}</div>;
  }

  return (
    <div className="h-full w-full border border-slate-400 bg-slate-700 p-2 pointer-events-auto flex flex-col relative">
      {iconGetter &&
        iconGetter(
          "absolute h-full p-6 pointer-events-none fill-slate-400 stroke-slate-400 opacity-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        )}
      <div className="text-lg">{getAbilityTreeAbilityNameString(ability)}</div>
      <Divider />
      {content}
    </div>
  );
});

function getConditionsToShowDetailButtonsFor(
  party: AdventuringParty,
  ability: AbilityTreeAbility,
  user: Combatant
): CombatantConditionName[] {
  if (ability.type !== AbilityType.Action) return [];

  const description = COMBAT_ACTION_DESCRIPTIONS[ability.actionName];
  const conditionsToShowDetailButtonsFor: CombatantConditionName[] = [];

  for (const actionRank of ArrayUtils.createFilledWithSequentialNumbers(3, 1)) {
    const rankDescription = description.getDescriptionByLevel(
      user,
      party,
      actionRank as ActionRank
    );
    const conditionsAppliedOption = rankDescription[ActionDescriptionComponent.AppliesConditions];
    if (!conditionsAppliedOption) continue;
    for (const conditionBlueprint of conditionsAppliedOption) {
      if (conditionsToShowDetailButtonsFor.includes(conditionBlueprint.name)) continue;
      conditionsToShowDetailButtonsFor.push(conditionBlueprint.name);
    }
  }

  return conditionsToShowDetailButtonsFor;
}

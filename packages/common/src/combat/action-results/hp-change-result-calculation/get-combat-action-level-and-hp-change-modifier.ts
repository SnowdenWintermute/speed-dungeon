import { ABILITY_ATTRIBUTES, CombatantProperties } from "../../../combatants/index.js";
import { CombatAction, CombatActionType } from "../../combat-actions/index.js";

export function getCombatActionLevelAndHpChangeModifier(
  combatAction: CombatAction,
  userCombatantProperties: CombatantProperties
) {
  const toReturn = { actionLevel: 1, actionLevelHpChangeModifier: 1 };

  if (combatAction.type !== CombatActionType.AbilityUsed) return toReturn;
  const abilityResult = CombatantProperties.getAbilityIfOwned(
    userCombatantProperties,
    combatAction.abilityName
  );
  if (abilityResult instanceof Error) return abilityResult;
  const ability = abilityResult;
  toReturn.actionLevel = ability.level;
  const abilityAttributes = ABILITY_ATTRIBUTES[ability.name];

  toReturn.actionLevelHpChangeModifier = abilityAttributes.baseHpChangeValuesLevelMultiplier;

  return toReturn;
}

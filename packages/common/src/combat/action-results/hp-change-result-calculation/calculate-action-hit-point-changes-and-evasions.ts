import cloneDeep from "lodash.clonedeep";
import { CombatantAbility, CombatantProperties } from "../../../combatants";
import { ERROR_MESSAGES } from "../../../errors";
import { SpeedDungeonGame } from "../../../game";
import {
  CombatActionProperties,
  CombatActionType,
  calculateCombatActionHpChangeRange,
} from "../../combat-actions";
import { ActionResultCalculationArguments } from "../action-result-calculator";
import getMostDamagingWeaponElementOnTarget from "./get-most-damaging-weapon-element-on-target";
import getMostDamagingWeaponPhysicalDamageTypeOnTarget from "./get-most-damaging-weapon-damage-type-on-target";
import { randBetween } from "../../../utils";
import splitHpChangeWithMultiTargetBonus from "./split-hp-change-with-multi-target-bonus";
import { MULTI_TARGET_HP_CHANGE_BONUS } from "../../../app_consts";
import { HpChangeSourceCategoryType } from "../../hp-change-source-types";
import getIdsOfEvadingEntities from "./get-ids-of-evading-entities";

export default function calculateActionHitPointChangesAndEvasions(
  game: SpeedDungeonGame,
  args: ActionResultCalculationArguments,
  targetIds: string[],
  actionProperties: CombatActionProperties
): Error | { hitPointChanges: { [entityId: string]: number }; evasions: string[] } {
  const firstTargetIdOption = targetIds[0];
  if (firstTargetIdOption === undefined)
    return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGET_PROVIDED);
  const firstTargetId = firstTargetIdOption;
  const hitPointChanges: { [entityId: string]: number } = {};
  let evasions: string[] = [];
  const hpChangeProperties = cloneDeep(actionProperties.hpChangeProperties);
  if (hpChangeProperties === null) return { hitPointChanges, evasions };

  const { userId, combatAction } = args;
  const combatantResult = SpeedDungeonGame.getCombatantById(game, userId);
  if (combatantResult instanceof Error) return combatantResult;
  const { combatantProperties: userCombatantProperties } = combatantResult;

  let actionLevel = 1;
  let actionLevelHpChangeModifier = 1;
  if (combatAction.type === CombatActionType.AbilityUsed) {
    const abilityOption = userCombatantProperties.abilities[combatAction.abilityName];
    if (!abilityOption) return new Error(ERROR_MESSAGES.ABILITIES.NOT_OWNED);
    const ability = abilityOption;
    actionLevel = ability.level;
    const abilityAttributes = CombatantAbility.getAttributes(ability.name);
    actionLevelHpChangeModifier = abilityAttributes.baseHpChangeValuesLevelMultiplier;
  }

  const hpChangeRangeResult = calculateCombatActionHpChangeRange(
    userCombatantProperties,
    hpChangeProperties,
    actionLevel,
    actionLevelHpChangeModifier
  );
  if (hpChangeRangeResult instanceof Error) return hpChangeRangeResult;
  const hpChangeRange = hpChangeRangeResult;

  // add weapon elements and damage types to the action's hp change source properties
  if (hpChangeProperties.addWeaponElementFrom !== null) {
    const elementToAddOptionResult = getMostDamagingWeaponElementOnTarget(
      game,
      hpChangeProperties.addWeaponElementFrom,
      userCombatantProperties,
      firstTargetId
    );
    if (elementToAddOptionResult instanceof Error) return elementToAddOptionResult;
    hpChangeProperties.sourceProperties.elementOption = elementToAddOptionResult;
  }

  if (hpChangeProperties.addWeaponDamageTypeFrom !== null) {
    const physicalDamageTypeToAddOptionResult = getMostDamagingWeaponPhysicalDamageTypeOnTarget(
      game,
      hpChangeProperties.addWeaponDamageTypeFrom,
      userCombatantProperties,
      firstTargetId
    );
    if (physicalDamageTypeToAddOptionResult instanceof Error)
      return physicalDamageTypeToAddOptionResult;
    hpChangeProperties.sourceProperties.physicalDamageTypeOption =
      physicalDamageTypeToAddOptionResult;
  }

  // roll the hp change value
  const rolledHpChangeValue = randBetween(hpChangeRange.min, hpChangeRange.max);
  const incomingHpChangePerTarget = splitHpChangeWithMultiTargetBonus(
    rolledHpChangeValue,
    targetIds.length,
    MULTI_TARGET_HP_CHANGE_BONUS
  );

  const userCombatantAttributes = CombatantProperties.getTotalAttributes(userCombatantProperties);
  const idsOfEvadingEntitiesResult = getIdsOfEvadingEntities(
    game,
    userCombatantAttributes,
    targetIds
  );
  if (idsOfEvadingEntitiesResult instanceof Error) return idsOfEvadingEntitiesResult;
  evasions = idsOfEvadingEntitiesResult;

  const idsOfNonEvadingTargets = targetIds.filter((id) => !evasions.includes(id));

  switch (hpChangeProperties.sourceProperties.category.type) {
    case HpChangeSourceCategoryType.PhysicalDamage:
    // calculatePhysicalDamageHpChanges
    case HpChangeSourceCategoryType.MagicalDamage:
    case HpChangeSourceCategoryType.Healing:
    case HpChangeSourceCategoryType.Direct:
  }

  return { hitPointChanges, evasions };
}

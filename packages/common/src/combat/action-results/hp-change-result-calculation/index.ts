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
import calculatePhysicalDamageHpChangesAndCrits from "./calculate-physical-damage-hp-changes-and-crits";
import calculateMagicalDamageHpChangesAndCrits from "./calculate-magical-damage-hp-changes-and-crits";
import calculateHealingHpChangesAndCrits from "./calculate-healing-hp-changes-and-crits";

export interface ValueChangesAndCrits {
  valueChangesByEntityId: { [entityId: string]: number };
  entityIdsCrit: string[];
}

export default function calculateActionHitPointChangesCritsAndEvasions(
  game: SpeedDungeonGame,
  args: ActionResultCalculationArguments,
  targetIds: string[],
  actionProperties: CombatActionProperties
):
  | Error
  | { hitPointChanges: { [entityId: string]: number }; evasions: string[]; crits: string[] } {
  const firstTargetIdOption = targetIds[0];
  if (firstTargetIdOption === undefined)
    return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGET_PROVIDED);
  const firstTargetId = firstTargetIdOption;
  let hitPointChanges: { [entityId: string]: number } = {};
  let evasions: string[] = [];
  let crits: string[] = [];

  const hpChangeProperties = cloneDeep(actionProperties.hpChangeProperties);
  if (hpChangeProperties === null) return { hitPointChanges, evasions, crits };

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

  if (
    hpChangeProperties.sourceProperties.category.type ===
      HpChangeSourceCategoryType.PhysicalDamage ||
    (hpChangeProperties.sourceProperties.category.type ===
      HpChangeSourceCategoryType.MagicalDamage &&
      hpChangeProperties.sourceProperties.category.evadable)
  ) {
    const idsOfEvadingEntitiesResult = getIdsOfEvadingEntities(
      game,
      userCombatantAttributes,
      targetIds
    );
    if (idsOfEvadingEntitiesResult instanceof Error) return idsOfEvadingEntitiesResult;
    evasions = idsOfEvadingEntitiesResult;
  }

  const idsOfNonEvadingTargets = targetIds.filter((id) => !evasions.includes(id));

  switch (hpChangeProperties.sourceProperties.category.type) {
    case HpChangeSourceCategoryType.PhysicalDamage:
      const physicalHpChangesResult = calculatePhysicalDamageHpChangesAndCrits(
        game,
        hpChangeProperties.sourceProperties.category.meleeOrRanged,
        userCombatantProperties,
        idsOfNonEvadingTargets,
        incomingHpChangePerTarget,
        hpChangeProperties
      );
      if (physicalHpChangesResult instanceof Error) return physicalHpChangesResult;
      crits = physicalHpChangesResult.entityIdsCrit;
      hitPointChanges = physicalHpChangesResult.valueChangesByEntityId;
      break;
    case HpChangeSourceCategoryType.MagicalDamage:
      const magicalHpChangesResult = calculateMagicalDamageHpChangesAndCrits(
        game,
        userCombatantProperties,
        idsOfNonEvadingTargets,
        incomingHpChangePerTarget,
        hpChangeProperties
      );
      if (magicalHpChangesResult instanceof Error) return magicalHpChangesResult;
      crits = magicalHpChangesResult.entityIdsCrit;
      hitPointChanges = magicalHpChangesResult.valueChangesByEntityId;
      break;
    case HpChangeSourceCategoryType.Healing:
      const healingHpChangesResult = calculateHealingHpChangesAndCrits(
        game,
        userCombatantProperties,
        idsOfNonEvadingTargets,
        incomingHpChangePerTarget,
        hpChangeProperties
      );
      if (healingHpChangesResult instanceof Error) return healingHpChangesResult;
      crits = healingHpChangesResult.entityIdsCrit;
      hitPointChanges = healingHpChangesResult.valueChangesByEntityId;
      break;
    case HpChangeSourceCategoryType.Direct:
      return new Error(ERROR_MESSAGES.TODO);
  }

  return { hitPointChanges, crits, evasions };
}

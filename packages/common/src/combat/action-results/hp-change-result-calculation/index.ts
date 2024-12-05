import cloneDeep from "lodash.clonedeep";
import { CombatantProperties } from "../../../combatants/index.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import {
  CombatActionProperties,
  CombatActionType,
  calculateCombatActionHpChangeRange,
} from "../../combat-actions/index.js";
import { randBetween } from "../../../utils/index.js";
import { ActionResultCalculationArguments } from "../action-result-calculator.js";
import getMostDamagingWeaponElementOnTarget from "./get-most-damaging-weapon-element-on-target.js";
import getMostDamagingWeaponPhysicalDamageTypeOnTarget from "./get-most-damaging-weapon-damage-type-on-target.js";
import splitHpChangeWithMultiTargetBonus from "./split-hp-change-with-multi-target-bonus.js";
import { MULTI_TARGET_HP_CHANGE_BONUS } from "../../../app-consts.js";
import { HpChangeSource, HpChangeSourceCategory } from "../../hp-change-source-types.js";
import getIdsOfEvadingEntities from "./get-ids-of-evading-entities.js";
import calculatePhysicalDamageHpChangesAndCrits from "./calculate-physical-damage-hp-changes-and-crits.js";
import calculateMagicalDamageHpChangesAndCrits from "./calculate-magical-damage-hp-changes-and-crits.js";
import calculateHealingHpChangesAndCrits from "./calculate-healing-hp-changes-and-crits.js";
import { ABILITY_ATTRIBUTES } from "../../../combatants/abilities/get-ability-attributes.js";

export class HpChange {
  constructor(
    public value: number,
    public source: HpChangeSource,
    public isCrit?: boolean
  ) {}
}

export default function calculateActionHitPointChangesAndEvasions(
  game: SpeedDungeonGame,
  args: ActionResultCalculationArguments,
  targetIds: string[],
  actionProperties: CombatActionProperties
):
  | Error
  | {
      hitPointChanges: { [entityId: string]: HpChange };
      evasions: string[];
    } {
  const firstTargetIdOption = targetIds[0];
  if (firstTargetIdOption === undefined)
    return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGET_PROVIDED);
  const firstTargetId = firstTargetIdOption;
  let hitPointChanges: { [entityId: string]: HpChange } = {};
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
    const abilityAttributes = ABILITY_ATTRIBUTES[ability.name];
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
  if (hpChangeProperties.addWeaponElementFromSlot !== null) {
    const elementToAddOptionResult = getMostDamagingWeaponElementOnTarget(
      game,
      hpChangeProperties.addWeaponElementFromSlot,
      userCombatantProperties,
      firstTargetId
    );
    if (elementToAddOptionResult instanceof Error) return elementToAddOptionResult;
    if (elementToAddOptionResult !== null)
      hpChangeProperties.hpChangeSource.elementOption = elementToAddOptionResult;
  }

  if (hpChangeProperties.addWeaponKineticDamageTypeFromSlot !== null) {
    const physicalDamageTypeToAddOptionResult = getMostDamagingWeaponPhysicalDamageTypeOnTarget(
      game,
      hpChangeProperties.addWeaponKineticDamageTypeFromSlot,
      userCombatantProperties,
      firstTargetId
    );
    if (physicalDamageTypeToAddOptionResult instanceof Error)
      return physicalDamageTypeToAddOptionResult;
    if (physicalDamageTypeToAddOptionResult !== null)
      hpChangeProperties.hpChangeSource.kineticDamageTypeOption =
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
  const { hpChangeSource } = hpChangeProperties;

  if (!hpChangeSource.unavoidable) {
    const idsOfEvadingEntitiesResult = getIdsOfEvadingEntities(
      game,
      userCombatantAttributes,
      targetIds
    );
    if (idsOfEvadingEntitiesResult instanceof Error) return idsOfEvadingEntitiesResult;
    evasions = idsOfEvadingEntitiesResult;
  }

  const idsOfNonEvadingTargets = targetIds.filter((id) => !evasions.includes(id));

  if (hpChangeSource.isHealing) {
    const healingHpChangesResult = calculateHealingHpChangesAndCrits(
      game,
      userCombatantProperties,
      idsOfNonEvadingTargets,
      incomingHpChangePerTarget,
      hpChangeProperties
    );
    if (healingHpChangesResult instanceof Error) return healingHpChangesResult;
    hitPointChanges = healingHpChangesResult;
  } else {
    switch (hpChangeSource.category) {
      case HpChangeSourceCategory.Physical:
        const physicalHpChangesResult = calculatePhysicalDamageHpChangesAndCrits(
          game,
          hpChangeSource.meleeOrRanged,
          userCombatantProperties,
          idsOfNonEvadingTargets,
          incomingHpChangePerTarget,
          hpChangeProperties
        );
        if (physicalHpChangesResult instanceof Error) return physicalHpChangesResult;
        hitPointChanges = physicalHpChangesResult;
        break;
      case HpChangeSourceCategory.Magical:
        const magicalHpChangesResult = calculateMagicalDamageHpChangesAndCrits(
          game,
          userCombatantProperties,
          idsOfNonEvadingTargets,
          incomingHpChangePerTarget,
          hpChangeProperties
        );
        if (magicalHpChangesResult instanceof Error) return magicalHpChangesResult;
        hitPointChanges = magicalHpChangesResult;
        break;
      case HpChangeSourceCategory.Direct:
        return new Error(ERROR_MESSAGES.TODO);
      case HpChangeSourceCategory.Medical:
        return new Error(ERROR_MESSAGES.TODO);
    }
  }

  for (const hpChange of Object.values(hitPointChanges)) {
    hpChange.value = Math.floor(hpChange.value);
  }

  return { hitPointChanges, evasions };
}

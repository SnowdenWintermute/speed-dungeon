import cloneDeep from "lodash.clonedeep";
import { CombatantProperties, CombatantTraitType } from "../../../combatants/index.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { CombatActionProperties, CombatActionType } from "../../combat-actions/index.js";
import { randBetween } from "../../../utils/index.js";
import { ActionResultCalculationArguments } from "../action-result-calculator.js";
import splitHpChangeWithMultiTargetBonus from "./split-hp-change-with-multi-target-bonus.js";
import { MULTI_TARGET_HP_CHANGE_BONUS } from "../../../app-consts.js";
import { ABILITY_ATTRIBUTES } from "../../../combatants/abilities/get-ability-attributes.js";
import { HP_CALCLULATION_CONTEXTS } from "./hp-change-calculation-strategies/index.js";
import { HpChange } from "../../hp-change-source-types.js";
import checkIfTargetWantsToBeHit from "./check-if-target-wants-to-be-hit.js";
import { NumberRange } from "../../../primatives/number-range.js";
import { scaleRangeToActionLevel } from "./scale-hp-range-to-action-level.js";
import { applyAdditiveAttributeToRange } from "./apply-additive-attribute-to-range.js";
import { Item, WeaponSlot } from "../../../items/index.js";
import { addWeaponsDamageToRange } from "./weapon-hp-change-modifiers/add-weapons-damage-to-range.js";
import { applyWeaponHpChangeModifiers } from "./weapon-hp-change-modifiers/index.js";

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

  const { min, max } = hpChangeProperties.baseValues;
  const hpChangeRange = new NumberRange(min, max);
  scaleRangeToActionLevel(hpChangeRange, actionLevel, actionLevelHpChangeModifier);
  applyAdditiveAttributeToRange(hpChangeRange, userCombatantProperties, hpChangeProperties);

  const equippedUsableWeaponsResult = CombatantProperties.getUsableWeaponsInSlots(
    userCombatantProperties,
    [WeaponSlot.MainHand, WeaponSlot.OffHand]
  );
  if (equippedUsableWeaponsResult instanceof Error) return equippedUsableWeaponsResult;
  const equippedUsableWeapons = equippedUsableWeaponsResult;

  const weaponsToAddDamageFrom: Partial<Record<WeaponSlot, Item>> = {};
  for (const slot of hpChangeProperties.addWeaponDamageFromSlots || []) {
    const weapon = equippedUsableWeapons[slot];
    if (!weapon) continue;
    weaponsToAddDamageFrom[slot] = weapon.item;
  }

  addWeaponsDamageToRange(weaponsToAddDamageFrom, hpChangeRange);

  hpChangeRange.min = Math.floor(hpChangeRange.min);
  hpChangeRange.max = Math.floor(hpChangeRange.max);

  // we need a target to check against to find the best affinity to choose
  // so we'll use the first target for now, until a better system comes to light
  const firstTargetCombatant = SpeedDungeonGame.getCombatantById(game, firstTargetId);
  if (firstTargetCombatant instanceof Error) return firstTargetCombatant;
  const { combatantProperties: targetCombatantProperties } = firstTargetCombatant;

  const { hpChangeSource } = hpChangeProperties;

  // need to roll it before selecting weapon hp change source type because
  // we need to check against armor class which mitigates based on rolled damage
  const rolledHpChangeValue = randBetween(hpChangeRange.min, hpChangeRange.max);
  const incomingHpChangePerTarget = splitHpChangeWithMultiTargetBonus(
    rolledHpChangeValue,
    targetIds.length,
    MULTI_TARGET_HP_CHANGE_BONUS
  );

  applyWeaponHpChangeModifiers(
    hpChangeProperties,
    equippedUsableWeapons,
    userCombatantProperties,
    targetCombatantProperties,
    incomingHpChangePerTarget
  );

  for (const id of targetIds) {
    const targetCombatantResult = SpeedDungeonGame.getCombatantById(game, id);
    if (targetCombatantResult instanceof Error) return targetCombatantResult;
    const { combatantProperties: targetCombatantProperties } = targetCombatantResult;
    let hpChange = new HpChange(incomingHpChangePerTarget, hpChangeSource);
    const hpChangeCalculationContext = HP_CALCLULATION_CONTEXTS[hpChangeSource.category];

    const targetWantsToBeHit = checkIfTargetWantsToBeHit(
      targetCombatantProperties,
      hpChangeProperties
    );

    const isHit = hpChangeCalculationContext.rollHit(
      userCombatantProperties,
      targetCombatantProperties,
      hpChangeSource.unavoidable || false,
      targetWantsToBeHit
    );
    if (!isHit) {
      evasions.push(id);
      continue;
    }

    hpChangeCalculationContext.rollCrit(
      hpChange,
      userCombatantProperties,
      targetCombatantProperties,
      targetWantsToBeHit
    );
    hpChangeCalculationContext.applyCritMultiplier(
      hpChange,
      hpChangeProperties,
      userCombatantProperties,
      targetCombatantProperties
    );
    hpChangeCalculationContext.applyKineticAffinities(hpChange, targetCombatantProperties);
    hpChangeCalculationContext.applyElementalAffinities(hpChange, targetCombatantProperties);

    if (
      !(
        hpChangeSource.isHealing &&
        // if it wasn't intended as healing, but is actually healing target due to affinities,
        // don't "un healify" the hp change here
        hpChange.value > 0 &&
        !CombatantProperties.hasTraitType(targetCombatantProperties, CombatantTraitType.Undead)
      )
    ) {
      hpChange.value *= -1;
    }

    // do this first since armor class effectiveness is based on total incoming damage
    hpChange.value *= hpChangeProperties.finalDamagePercentMultiplier / 100;

    hpChangeCalculationContext.applyResilience(
      hpChange,
      userCombatantProperties,
      targetCombatantProperties
    );
    hpChangeCalculationContext.applyArmorClass(
      hpChange,
      userCombatantProperties,
      targetCombatantProperties
    );

    hpChange.value = Math.floor(hpChange.value);

    hitPointChanges[id] = hpChange;
  }

  return { hitPointChanges, evasions };
}

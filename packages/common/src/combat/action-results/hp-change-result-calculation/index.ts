import cloneDeep from "lodash.clonedeep";
import { CombatantProperties, CombatantTraitType } from "../../../combatants/index.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { CombatActionProperties } from "../../combat-actions/index.js";
import { randBetween } from "../../../utils/index.js";
import { ActionResultCalculationArguments } from "../action-result-calculator.js";
import splitHpChangeWithMultiTargetBonus from "./split-hp-change-with-multi-target-bonus.js";
import { MULTI_TARGET_HP_CHANGE_BONUS } from "../../../app-consts.js";
import { HP_CALCLULATION_CONTEXTS } from "./hp-change-calculation-strategies/index.js";
import { HpChange } from "../../hp-change-source-types.js";
import checkIfTargetWantsToBeHit from "./check-if-target-wants-to-be-hit.js";
import { getActionHitChance } from "./get-action-hit-chance.js";
import { applyCritMultiplier } from "./apply-crit-multiplier-to-hp-change.js";
import {
  applyElementalAffinities,
  applyKineticAffinities,
} from "./apply-affinites-to-hp-change.js";
import { applyWeaponHpChangeModifiers } from "./weapon-hp-change-modifiers/index.js";
import { WeaponSlot } from "../../../items/index.js";
import { getCombatActionHpChangeRange } from "./get-combat-action-hp-change-range.js";
export * from "./get-combat-action-hp-change-range.js";
export * from "./weapon-hp-change-modifiers/index.js";

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
  const { userId, combatAction } = args;
  const combatantResult = SpeedDungeonGame.getCombatantById(game, userId);
  if (combatantResult instanceof Error) return combatantResult;
  const { combatantProperties: userCombatantProperties } = combatantResult;

  // we need a target to check against to find the best affinity to choose
  // so we'll use the first target for now, until a better system comes to light
  const firstTargetIdOption = targetIds[0];
  if (firstTargetIdOption === undefined)
    return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGET_PROVIDED);
  const firstTargetId = firstTargetIdOption;
  const firstTargetCombatant = SpeedDungeonGame.getCombatantById(game, firstTargetId);
  if (firstTargetCombatant instanceof Error) return firstTargetCombatant;
  const { combatantProperties: targetCombatantProperties } = firstTargetCombatant;

  let hitPointChanges: { [entityId: string]: HpChange } = {};
  let evasions: string[] = [];

  if (actionProperties.hpChangeProperties === null) return { hitPointChanges, evasions };
  const hpChangeProperties = cloneDeep(actionProperties.hpChangeProperties);

  const equippedUsableWeaponsResult = CombatantProperties.getUsableWeaponsInSlots(
    userCombatantProperties,
    [WeaponSlot.MainHand, WeaponSlot.OffHand]
  );
  if (equippedUsableWeaponsResult instanceof Error) return equippedUsableWeaponsResult;
  const equippedUsableWeapons = equippedUsableWeaponsResult;

  const hpChangeRangeResult = getCombatActionHpChangeRange(
    combatAction,
    hpChangeProperties,
    userCombatantProperties,
    equippedUsableWeapons
  );
  if (hpChangeRangeResult instanceof Error) return hpChangeRangeResult;

  const hpChangeRange = hpChangeRangeResult;

  const averageRoll = Math.floor(hpChangeRange.min + hpChangeRange.max / 2);

  applyWeaponHpChangeModifiers(
    hpChangeProperties,
    equippedUsableWeapons,
    userCombatantProperties,
    targetCombatantProperties,
    averageRoll
  );

  const { hpChangeSource } = hpChangeProperties;

  const rolledHpChangeValue = randBetween(hpChangeRange.min, hpChangeRange.max);
  const incomingHpChangePerTarget = splitHpChangeWithMultiTargetBonus(
    rolledHpChangeValue,
    targetIds.length,
    MULTI_TARGET_HP_CHANGE_BONUS
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

    const percentChanceToHit = getActionHitChance(
      actionProperties,
      userCombatantProperties,
      targetCombatantProperties,
      hpChangeSource.unavoidable || false,
      targetWantsToBeHit
    );

    const hitRoll = randBetween(0, 100);

    const isHit = hitRoll <= percentChanceToHit;

    if (!isHit) {
      evasions.push(id);
      continue;
    }

    const percentChanceToCrit = hpChangeCalculationContext.getActionCritChance(
      userCombatantProperties,
      targetCombatantProperties,
      targetWantsToBeHit
    );

    hpChange.isCrit = randBetween(0, 100) < percentChanceToCrit;

    applyCritMultiplier(
      hpChange,
      hpChangeProperties,
      userCombatantProperties,
      targetCombatantProperties
    );
    applyKineticAffinities(hpChange, targetCombatantProperties);
    applyElementalAffinities(hpChange, targetCombatantProperties);

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

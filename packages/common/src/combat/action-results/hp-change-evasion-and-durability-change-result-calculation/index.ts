import cloneDeep from "lodash.clonedeep";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { randBetween } from "../../../utils/index.js";
import splitHpChangeWithMultiTargetBonus from "./split-hp-change-with-multi-target-bonus.js";
import { MULTI_TARGET_HP_CHANGE_BONUS } from "../../../app-consts.js";
import { HP_CALCLULATION_CONTEXTS } from "./hp-change-calculation-strategies/index.js";
import { HpChange, HpChangeSource, HpChangeSourceCategory } from "../../hp-change-source-types.js";
import { checkIfTargetWantsToBeHit } from "./check-if-target-wants-to-be-hit.js";
import { applyCritMultiplier } from "./apply-crit-multiplier-to-hp-change.js";
import { EntityId } from "../../../primatives/index.js";
import {
  DurabilityChangesByEntityId,
  calculateActionDurabilityChangesOnHit,
  updateConditionalDurabilityChangesOnUser,
} from "../calculate-action-durability-changes.js";
import { CombatActionComponent } from "../../combat-actions/index.js";
import { convertHpChangeValueToFinalSign } from "../../combat-actions/action-calculation-utils/convert-hp-change-value-to-final-sign.js";
import {
  applyElementalAffinities,
  applyKineticAffinities,
} from "../../combat-actions/action-calculation-utils/apply-affinities-to-hp-change.js";
import { DurabilityLossCondition } from "../../combat-actions/combat-action-durability-loss-condition.js";
import { getActionHitChance } from "./get-action-hit-chance.js";
import { CombatantProperties } from "../../../combatants/index.js";
import { CombatAttribute } from "../../../combatants/attributes/index.js";
import { getActionCritChance } from "./get-action-crit-chance.js";
import { CombatActionTarget } from "../../targeting/combat-action-targets.js";
import { Battle } from "../../../battle/index.js";
export * from "./get-action-hit-chance.js";
export * from "./get-action-crit-chance.js";
export * from "./hp-change-calculation-strategies/index.js";
export * from "./check-if-target-wants-to-be-hit.js";

export function calculateActionHitPointChangesEvasionsAndDurabilityChanges(
  game: SpeedDungeonGame,
  args: {
    combatAction: CombatActionComponent;
    userId: string;
    targets: CombatActionTarget;
    battleOption: null | Battle;
    allyIds: string[];
  },
  targetIds: string[],
  action: CombatActionComponent
):
  | Error
  | {
      hitPointChanges: { [entityId: string]: HpChange };
      evasions: string[];
      durabilityChanges: DurabilityChangesByEntityId;
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

  const hitPointChanges: { [entityId: EntityId]: HpChange } = {};
  const durabilityChanges = new DurabilityChangesByEntityId();
  let lifestealHpChange: null | HpChange = null;

  let evasions: string[] = [];

  const hpChangeProperties = cloneDeep(
    action.getHpChangeProperties(userCombatantProperties, targetCombatantProperties)
  );
  if (hpChangeProperties === null) return { hitPointChanges, evasions, durabilityChanges };

  const hpChangeRange = hpChangeProperties.baseValues;

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
    let hpChange = new HpChange(incomingHpChangePerTarget, cloneDeep(hpChangeSource));

    const hpChangeCalculationContext = HP_CALCLULATION_CONTEXTS[hpChangeSource.category];

    const targetWantsToBeHit = checkIfTargetWantsToBeHit(
      action,
      userCombatantProperties,
      targetCombatantProperties
    );

    const percentChanceToHit = getActionHitChance(
      action,
      userCombatantProperties,
      CombatantProperties.getTotalAttributes(targetCombatantProperties)[CombatAttribute.Evasion],
      targetWantsToBeHit
    );

    const percentChanceToCrit = getActionCritChance(
      action,
      userCombatantProperties,
      targetCombatantProperties,
      targetWantsToBeHit
    );

    ///////////////////////////////////////////////////
    // separately calculating weapon dura loss if is "on use" instead of "on hit"
    // such as with firing a bow

    updateConditionalDurabilityChangesOnUser(
      userId,
      action,
      durabilityChanges,
      DurabilityLossCondition.OnUse
    );

    const isHit = randBetween(0, 100) <= percentChanceToHit;

    if (!isHit) {
      evasions.push(id);
      continue;
    }

    hpChange.isCrit = randBetween(0, 100) < percentChanceToCrit;

    // determine durability loss of target's armor and user's weapon
    calculateActionDurabilityChangesOnHit(
      combatantResult,
      targetCombatantResult,
      action,
      isHit,
      hpChange.isCrit,
      durabilityChanges
    );

    applyCritMultiplier(hpChange, action, userCombatantProperties, targetCombatantProperties);

    applyKineticAffinities(hpChange, targetCombatantProperties);
    applyElementalAffinities(hpChange, targetCombatantProperties);

    convertHpChangeValueToFinalSign(hpChange, targetCombatantProperties);

    hpChangeCalculationContext.applyResilience(
      hpChange,
      userCombatantProperties,
      targetCombatantProperties
    );

    hpChangeCalculationContext.applyArmorClass(
      action,
      hpChange,
      userCombatantProperties,
      targetCombatantProperties
    );

    hpChange.value = Math.floor(hpChange.value);

    hitPointChanges[id] = hpChange;

    // apply lifesteal trait
    // determine if hp change source has lifesteal
    // get the percent
    // add it to the lifesteal hp change of the action user
    if (hpChange.source.lifestealPercentage) {
      const lifestealValue = hpChange.value * (hpChange.source.lifestealPercentage / 100) * -1;
      if (!lifestealHpChange) {
        lifestealHpChange = new HpChange(
          lifestealValue,
          new HpChangeSource({ category: HpChangeSourceCategory.Magical })
        );
        lifestealHpChange.isCrit = hpChange.isCrit;
        lifestealHpChange.value = lifestealValue;
      } else {
        // if aggregating lifesteal from multiple hits, call it a crit if any of the hits were crits
        if (hpChange.isCrit) lifestealHpChange.isCrit = true;
        lifestealHpChange.value += lifestealValue;
      }
    }
  }

  if (lifestealHpChange) {
    lifestealHpChange.value = Math.floor(lifestealHpChange.value);
    hitPointChanges[userId] = lifestealHpChange;
  }

  return { hitPointChanges, evasions, durabilityChanges };
}

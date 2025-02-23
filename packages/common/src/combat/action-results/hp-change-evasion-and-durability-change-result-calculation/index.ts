import cloneDeep from "lodash.clonedeep";
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
import { TargetingCalculator } from "../../targeting/targeting-calculator.js";
import { ActionResolutionStepContext } from "../../../action-processing/index.js";
import { COMBAT_ACTIONS } from "../../combat-actions/action-implementations/index.js";
import { CombatActionComponent } from "../../combat-actions/index.js";
export * from "./get-action-hit-chance.js";
export * from "./get-action-crit-chance.js";
export * from "./hp-change-calculation-strategies/index.js";
export * from "./check-if-target-wants-to-be-hit.js";

export interface CombatActionHitOutcomes {
  hitPointChanges?: Record<EntityId, HpChange>;
  manaChanges?: Record<EntityId, number>;
  durabilityChanges?: DurabilityChangesByEntityId;
  // distinct from hitPointChanges, "hits" is used to determine triggers for abilities that don't cause
  // hit point changes, but may apply a condition to their target or otherwise change something
  hits?: Set<EntityId>;
  misses?: Set<EntityId>;
  evades?: Set<EntityId>;
  parries?: Set<EntityId>;
  counters?: Set<EntityId>;
  blocks?: Set<EntityId>;
}
// CALCULATE AND COLLECT THE FOLLOWING:
// hp changes, mp changes, durability changes, misses, evades, parries, counters, blocks
// CALCULATION ORDER
// miss
// - client shows miss text
// evade
// - client plays evade animation on target entity
// parry
// - client plays parry animation on target entity
// - notify next step of the parry so if the ability calls for it,
// server sends instruction in recoveryMotion that user should play a hit-interrupted animation for the followthrough
// counter
// - start a branching "counterattack" action on the target entity
// - notify next step of the counter so if the ability calls for it,
// server sends instruction in recoveryMotion that user should play a hit-interrupted animation for the followthrough
//   and also remain in place long enough to be hit by the counter attack
// block
// - client plays block animation on target entity
// - notify next step of the block so if the ability calls for it,
// server sends instruction in recoveryMotion that user should play a hit-interrupted animation for the followthrough

export function calculateActionHitPointChangesEvasionsAndDurabilityChanges(
  context: ActionResolutionStepContext
): Error | CombatActionHitOutcomes {
  const targetingCalculator = new TargetingCalculator(context.combatantContext, null);
  const { actionExecutionIntent } = context.tracker;
  const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
  const { game, party, combatant } = context.combatantContext;
  const { combatantProperties: userCombatantProperties } = combatant;

  // we need a target to check against to find the best affinity to choose
  // so we'll use the first target for now, until a better system comes to light
  const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
    party,
    actionExecutionIntent
  );
  if (primaryTargetResult instanceof Error) return primaryTargetResult;
  const targetCombatantProperties = primaryTargetResult;

  const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
    action,
    actionExecutionIntent.targets
  );
  if (targetIdsResult instanceof Error) return targetIdsResult;
  const targetIds = targetIdsResult;

  const hitOutcomes: CombatActionHitOutcomes = {};
  const durabilityChanges = new DurabilityChangesByEntityId();
  let lifestealHpChange: null | HpChange = null;

  const incomingHpChangePerTargetOption = getIncomingHpChangePerTarget(
    action,
    userCombatantProperties,
    targetCombatantProperties,
    targetIds
  );

  for (const id of targetIds) {
    const targetCombatantResult = SpeedDungeonGame.getCombatantById(game, id);
    if (targetCombatantResult instanceof Error) return targetCombatantResult;
    const { combatantProperties: targetCombatantProperties } = targetCombatantResult;

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
      combatant.entityProperties.id,
      action,
      durabilityChanges,
      DurabilityLossCondition.OnUse
    );

    const hitRoll = randBetween(0, 100);
    const isMiss = hitRoll > percentChanceToHit.beforeEvasion;
    const isEvaded = !isMiss && hitRoll > percentChanceToHit.afterEvasion;

    if (isMiss) {
      if (!hitOutcomes.misses) hitOutcomes.misses = new Set();
      hitOutcomes.misses.add(id);
    }
    if (isEvaded) {
      if (!hitOutcomes.evades) hitOutcomes.evades = new Set();
      hitOutcomes.evades.add(id);
    }
    if (isMiss || isEvaded) continue;

    if (!hitOutcomes.hits) hitOutcomes.hits = new Set();
    hitOutcomes.hits.add(id);

    if (!incomingHpChangePerTargetOption) continue;
    const { value: incomingHpChangeValue, hpChangeSource } = incomingHpChangePerTargetOption;
    let hpChange = new HpChange(incomingHpChangeValue, cloneDeep(hpChangeSource));
    hpChange.isCrit = randBetween(0, 100) < percentChanceToCrit;

    // determine durability loss of target's armor and user's weapon
    calculateActionDurabilityChangesOnHit(
      combatant,
      targetCombatantResult,
      action,
      true,
      hpChange.isCrit,
      durabilityChanges
    );

    applyCritMultiplier(hpChange, action, userCombatantProperties, targetCombatantProperties);

    applyKineticAffinities(hpChange, targetCombatantProperties);
    applyElementalAffinities(hpChange, targetCombatantProperties);

    convertHpChangeValueToFinalSign(hpChange, targetCombatantProperties);

    const hpChangeCalculationContext = HP_CALCLULATION_CONTEXTS[hpChangeSource.category];

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

    if (!hitOutcomes.hitPointChanges) hitOutcomes.hitPointChanges = {};
    hitOutcomes.hitPointChanges[id] = hpChange;

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

  return hitOutcomes;
}

function getIncomingHpChangePerTarget(
  action: CombatActionComponent,
  userCombatantProperties: CombatantProperties,
  primaryTargetCombatantProperties: CombatantProperties,
  targetIds: EntityId[]
): null | { value: number; hpChangeSource: HpChangeSource } {
  const hpChangePropertiesOption = cloneDeep(
    action.getHpChangeProperties(userCombatantProperties, primaryTargetCombatantProperties)
  );

  if (!hpChangePropertiesOption) return null;
  const hpChangeRange = hpChangePropertiesOption.baseValues;
  const { hpChangeSource } = hpChangePropertiesOption;
  const rolledHpChangeValue = randBetween(hpChangeRange.min, hpChangeRange.max);
  return {
    value: splitHpChangeWithMultiTargetBonus(
      rolledHpChangeValue,
      targetIds.length,
      MULTI_TARGET_HP_CHANGE_BONUS
    ),
    hpChangeSource,
  };
}

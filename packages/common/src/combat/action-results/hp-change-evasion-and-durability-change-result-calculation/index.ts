import cloneDeep from "lodash.clonedeep";
import { SpeedDungeonGame } from "../../../game/index.js";
import { randBetween } from "../../../utils/index.js";
import splitHpChangeWithMultiTargetBonus from "./split-hp-change-with-multi-target-bonus.js";
import { MULTI_TARGET_HP_CHANGE_BONUS } from "../../../app-consts.js";
import { HP_CALCLULATION_CONTEXTS } from "./hp-change-calculation-strategies/index.js";
import { HpChange, HpChangeSource } from "../../hp-change-source-types.js";
import { checkIfTargetWantsToBeHit } from "./check-if-target-wants-to-be-hit.js";
import { applyCritMultiplier } from "./apply-crit-multiplier-to-hp-change.js";
import { EntityId } from "../../../primatives/index.js";
import { DurabilityChangesByEntityId } from "../calculate-action-durability-changes.js";
import { convertHpChangeValueToFinalSign } from "../../combat-actions/action-calculation-utils/convert-hp-change-value-to-final-sign.js";
import {
  applyElementalAffinities,
  applyKineticAffinities,
} from "../../combat-actions/action-calculation-utils/apply-affinities-to-hp-change.js";
import { getActionHitChance } from "./get-action-hit-chance.js";
import { CombatantProperties } from "../../../combatants/index.js";
import { CombatAttribute } from "../../../combatants/attributes/index.js";
import { getActionCritChance } from "./get-action-crit-chance.js";
import { TargetingCalculator } from "../../targeting/targeting-calculator.js";
import { ActionResolutionStepContext } from "../../../action-processing/index.js";
import { COMBAT_ACTIONS } from "../../combat-actions/action-implementations/index.js";
import { CombatActionComponent } from "../../combat-actions/index.js";
import { getShieldBlockDamageReduction } from "./get-shield-block-damage-reduction.js";
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

export function calculateActionHitPointChangesEvasionsAndDurabilityChanges(
  context: ActionResolutionStepContext
): Error | CombatActionHitOutcomes {
  const targetingCalculator = new TargetingCalculator(context.combatantContext, null);
  const { actionExecutionIntent } = context.tracker;
  const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
  const { game, party, combatant } = context.combatantContext;
  const { combatantProperties: user } = combatant;

  // we need a target to check against to find the best affinity to choose
  // so we'll use the first target for now, until a better system comes to light
  const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
    party,
    actionExecutionIntent
  );
  if (primaryTargetResult instanceof Error) return primaryTargetResult;
  const target = primaryTargetResult;

  const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
    action,
    actionExecutionIntent.targets
  );
  if (targetIdsResult instanceof Error) return targetIdsResult;
  const targetIds = targetIdsResult;

  const hitOutcomes: CombatActionHitOutcomes = {};

  const incomingHpChangePerTargetOption = getIncomingHpChangePerTarget(
    action,
    user,
    target,
    targetIds
  );

  for (const id of targetIds) {
    const targetCombatantResult = SpeedDungeonGame.getCombatantById(game, id);
    if (targetCombatantResult instanceof Error) return targetCombatantResult;
    const { combatantProperties: target } = targetCombatantResult;

    // HITS
    const targetWantsToBeHit = checkIfTargetWantsToBeHit(action, user, target);

    const percentChanceToHit = getActionHitChance(
      action,
      user,
      CombatantProperties.getTotalAttributes(target)[CombatAttribute.Evasion],
      targetWantsToBeHit
    );

    const hitRoll = randBetween(0, 100);
    const isMiss = hitRoll > percentChanceToHit.beforeEvasion;
    const isEvaded = !isMiss && hitRoll > percentChanceToHit.afterEvasion;

    if (isMiss) {
      if (!hitOutcomes.misses) hitOutcomes.misses = new Set();
      hitOutcomes.misses.add(id);
      continue;
    }
    if (isEvaded) {
      if (!hitOutcomes.evades) hitOutcomes.evades = new Set();
      hitOutcomes.evades.add(id);
      continue;
    }

    // PARRIES
    if (
      action.getIsParryable(user) &&
      CombatantProperties.canParry(target) &&
      !targetWantsToBeHit
    ) {
      const percentChanceToParry = 5; // @TODO - derrive this from attributes (focus?), traits (parryBonus) and conditions (parryStance)
      const parryRoll = randBetween(0, 100);
      const isParried = parryRoll < percentChanceToParry;
      if (isParried) {
        if (!hitOutcomes.parries) hitOutcomes.parries = new Set();
        hitOutcomes.parries.add(id);
        continue;
      }
    }

    // COUNTERATTACKS
    if (action.getCanTriggerCounterattack(user) && !targetWantsToBeHit) {
      const percentChanceToCounterAttack = 5; // @TODO - derrive this from various combatant properties
      const counterAttackRoll = randBetween(0, 100);
      const isCounterAttacked = counterAttackRoll < percentChanceToCounterAttack;
      if (isCounterAttacked) {
        if (!hitOutcomes.counters) hitOutcomes.counters = new Set();
        hitOutcomes.counters.add(id);
        continue;
      }
    }

    // it is possible that an ability hits, but does not change HP, ex: a spell that only induces a condition
    if (!hitOutcomes.hits) hitOutcomes.hits = new Set();
    hitOutcomes.hits.add(id);

    if (!incomingHpChangePerTargetOption) continue;
    const { value: incomingHpChangeValue, hpChangeSource } = incomingHpChangePerTargetOption;
    let hpChange = new HpChange(incomingHpChangeValue, cloneDeep(hpChangeSource));

    const percentChanceToCrit = getActionCritChance(action, user, target, targetWantsToBeHit);

    hpChange.isCrit = randBetween(0, 100) < percentChanceToCrit;
    applyCritMultiplier(hpChange, action, user, target);
    applyKineticAffinities(hpChange, target);
    applyElementalAffinities(hpChange, target);

    // BLOCK
    if (
      action.getIsBlockable(user) &&
      CombatantProperties.canBlock(target) &&
      !targetWantsToBeHit // this should be checking if actions with malicious intent are in fact healing the target
    ) {
      const percentChanceToBlock = 5; // @TODO - do something like ffxi: BlockRate = SizeBaseBlockRate + ((ShieldSkill - AttackerCombatSkill) × 0.2325)
      const blockRoll = randBetween(0, 100);
      const isBlocked = blockRoll < percentChanceToBlock;
      if (isBlocked) {
        if (!hitOutcomes.blocks) hitOutcomes.blocks = new Set();
        hitOutcomes.blocks.add(id);

        const damageReduction = getShieldBlockDamageReduction(target);
        hpChange.value = hpChange.value - hpChange.value * damageReduction;
      }
    }

    convertHpChangeValueToFinalSign(hpChange, target);

    const hpChangeCalculationContext = HP_CALCLULATION_CONTEXTS[hpChangeSource.category];
    hpChangeCalculationContext.applyResilience(hpChange, user, target);
    hpChangeCalculationContext.applyArmorClass(action, hpChange, user, target);

    hpChange.value = Math.floor(hpChange.value);

    if (!hitOutcomes.hitPointChanges) hitOutcomes.hitPointChanges = {};
    hitOutcomes.hitPointChanges[id] = hpChange;
  }

  return hitOutcomes;
}

function getIncomingHpChangePerTarget(
  action: CombatActionComponent,
  user: CombatantProperties,
  primaryTargetCombatantProperties: CombatantProperties,
  targetIds: EntityId[]
): null | { value: number; hpChangeSource: HpChangeSource } {
  const hpChangePropertiesOption = cloneDeep(
    action.getHpChangeProperties(user, primaryTargetCombatantProperties)
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

import cloneDeep from "lodash.clonedeep";
import { SpeedDungeonGame } from "../../../game/index.js";
import { randBetween } from "../../../utils/index.js";
import splitResourceChangeWithMultiTargetBonus from "./split-hp-change-with-multi-target-bonus.js";
import { MULTI_TARGET_RESOURCE_CHANGE_BONUS } from "../../../app-consts.js";
import { HP_CALCLULATION_CONTEXTS } from "./hp-change-calculation-strategies/index.js";
import { ResourceChange, ResourceChangeSource } from "../../hp-change-source-types.js";
import { checkIfTargetWantsToBeHit } from "./check-if-target-wants-to-be-hit.js";
import { applyCritMultiplier } from "./apply-crit-multiplier-to-hp-change.js";
import { EntityId } from "../../../primatives/index.js";
import { convertResourceChangeValueToFinalSign } from "../../combat-actions/action-calculation-utils/convert-hp-change-value-to-final-sign.js";
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
import { getShieldBlockDamageReduction } from "./get-shield-block-damage-reduction.js";
export * from "./get-action-hit-chance.js";
export * from "./get-action-crit-chance.js";
export * from "./hp-change-calculation-strategies/index.js";
export * from "./check-if-target-wants-to-be-hit.js";
export * from "./resource-changes.js";

import { DurabilityChangesByEntityId } from "../../../durability/index.js";
import { HitOutcome } from "../../../hit-outcome.js";
import { HitPointChanges, ManaChanges, ResourceChanges } from "./resource-changes.js";
import { CombatActionResourceChangeProperties } from "../../combat-actions/combat-action-resource-change-properties.js";

export class CombatActionHitOutcomes {
  hitPointChanges?: HitPointChanges;
  manaChanges?: ManaChanges;
  durabilityChanges?: DurabilityChangesByEntityId;
  // distinct from hitPointChanges, "hits" is used to determine triggers for abilities that don't cause
  // hit point changes, but may apply a condition to their target or otherwise change something
  outcomeFlags: Partial<Record<HitOutcome, EntityId[]>> = {};
  constructor() {}
  insertOutcomeFlag(flag: HitOutcome, entityId: EntityId) {
    const idsFlagged = this.outcomeFlags[flag];
    if (!idsFlagged) this.outcomeFlags[flag] = [entityId];
    else idsFlagged.push(entityId);
  }
}

export function calculateActionHitOutcomes(
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

  const hitOutcomes = new CombatActionHitOutcomes();

  const actionHpChangePropertiesOption = cloneDeep(action.getHpChangeProperties(user, target));
  const actionManaChangePropertiesOption = cloneDeep(action.getManaChangeProperties(user, target));

  console.log("hp change properties", actionHpChangePropertiesOption);
  const incomingHpChangePerTargetOption = getIncomingResourceChangePerTarget(
    targetIds,
    actionHpChangePropertiesOption
  );
  console.log("incomingHpChangePerTargetOption", incomingHpChangePerTargetOption);

  const incomingManaChangePerTargetOption = getIncomingResourceChangePerTarget(
    targetIds,
    actionManaChangePropertiesOption
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
      hitOutcomes.insertOutcomeFlag(HitOutcome.Miss, id);
      continue;
    }
    if (isEvaded) {
      hitOutcomes.insertOutcomeFlag(HitOutcome.Evade, id);
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
        hitOutcomes.insertOutcomeFlag(HitOutcome.Parry, id);
        continue;
      }
    }

    // COUNTERATTACKS
    if (action.getCanTriggerCounterattack(user) && !targetWantsToBeHit) {
      const percentChanceToCounterAttack = 0; // @TODO - derrive this from various combatant properties
      const counterAttackRoll = randBetween(0, 100);
      const isCounterAttacked = counterAttackRoll < percentChanceToCounterAttack;
      if (isCounterAttacked) {
        hitOutcomes.insertOutcomeFlag(HitOutcome.Counterattack, id);
        continue;
      }
    }

    // it is possible that an ability hits, but does not change HP, ex: a spell that only induces a condition
    hitOutcomes.insertOutcomeFlag(HitOutcome.Hit, id);

    // BLOCK
    let blockDamageReductionNormalizedPercentage = 0;
    if (incomingHpChangePerTargetOption || incomingManaChangePerTargetOption) {
      if (
        action.getIsBlockable(user) &&
        CombatantProperties.canBlock(target) &&
        !targetWantsToBeHit // this should be checking if actions with malicious intent are in fact healing the target
      ) {
        const percentChanceToBlock = 5; // @TODO - do something like ffxi: BlockRate = SizeBaseBlockRate + ((ShieldSkill - AttackerCombatSkill) × 0.2325)
        const blockRoll = randBetween(0, 100);
        const isBlocked = blockRoll < percentChanceToBlock;
        if (isBlocked) {
          hitOutcomes.insertOutcomeFlag(HitOutcome.ShieldBlock, id);

          blockDamageReductionNormalizedPercentage = getShieldBlockDamageReduction(target);
        }
      }
    }

    const resourceChanges: {
      incomingChange: { value: number; resourceChangeSource: ResourceChangeSource } | null;
      record: HitPointChanges | ManaChanges;
    }[] = [];

    if (incomingHpChangePerTargetOption) {
      const record = new HitPointChanges();
      hitOutcomes.hitPointChanges = record;
      resourceChanges.push({
        incomingChange: incomingHpChangePerTargetOption,
        record,
      });
    }

    if (incomingManaChangePerTargetOption) {
      const record = new ManaChanges();
      hitOutcomes.manaChanges = record;
      resourceChanges.push({
        incomingChange: incomingManaChangePerTargetOption,
        record,
      });
    }

    for (const incomingResourceChangeOption of resourceChanges) {
      if (!incomingResourceChangeOption.incomingChange) continue;
      const { value, resourceChangeSource } = incomingResourceChangeOption.incomingChange;

      const resourceChange = new ResourceChange(value, cloneDeep(resourceChangeSource));

      const percentChanceToCrit = getActionCritChance(action, user, target, targetWantsToBeHit);

      resourceChange.isCrit = randBetween(0, 100) < percentChanceToCrit;
      applyCritMultiplier(resourceChange, action, user, target);
      applyKineticAffinities(resourceChange, target);
      applyElementalAffinities(resourceChange, target);

      if (blockDamageReductionNormalizedPercentage)
        resourceChange.value = Math.max(
          0,
          resourceChange.value - resourceChange.value * blockDamageReductionNormalizedPercentage
        );

      convertResourceChangeValueToFinalSign(resourceChange, target);

      const resourceChangeCalculationContext =
        HP_CALCLULATION_CONTEXTS[resourceChangeSource.category];

      resourceChangeCalculationContext.applyArmorClass(action, resourceChange, user, target);
      resourceChangeCalculationContext.applyResilience(resourceChange, user, target);

      resourceChange.value = Math.floor(resourceChange.value);

      incomingResourceChangeOption.record.addRecord(id, resourceChange);
    }
  }

  return hitOutcomes;
}

export function getIncomingResourceChangePerTarget(
  targetIds: EntityId[],
  resourceChangeProperties: CombatActionResourceChangeProperties | null
): null | { value: number; resourceChangeSource: ResourceChangeSource } {
  console.log("resourceChangeProperties", resourceChangeProperties);
  if (resourceChangeProperties === null) return null;
  const resourceChangeRange = resourceChangeProperties.baseValues;
  const { resourceChangeSource } = resourceChangeProperties;
  const rolledResourceChangeValue = randBetween(resourceChangeRange.min, resourceChangeRange.max);

  return {
    value: splitResourceChangeWithMultiTargetBonus(
      rolledResourceChangeValue,
      targetIds.length,
      MULTI_TARGET_RESOURCE_CHANGE_BONUS
    ),
    resourceChangeSource,
  };
}

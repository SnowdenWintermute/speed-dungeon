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
export * from "./get-action-hit-chance.js";
export * from "./get-action-crit-chance.js";
export * from "./hp-change-calculation-strategies/index.js";
export * from "./check-if-target-wants-to-be-hit.js";
export * from "./resource-changes.js";

import { DurabilityChangesByEntityId } from "../../../durability/index.js";
import { HitOutcome } from "../../../hit-outcome.js";
import { HitPointChanges, ManaChanges } from "./resource-changes.js";
import { CombatActionResourceChangeProperties } from "../../combat-actions/combat-action-resource-change-properties.js";
import { COMBAT_ACTIONS } from "../../combat-actions/action-implementations/index.js";
import { filterTargetIdGroupByProhibitedCombatantStates } from "../../targeting/filtering.js";
import { getShieldBlockChance, getShieldBlockDamageReduction } from "./shield-blocking.js";
import { getParryChance } from "./get-parry-chance.js";

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
  const { hitOutcomeProperties } = action;
  const { game, party, combatant } = context.combatantContext;
  const { combatantProperties: user } = combatant;

  const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
    action,
    actionExecutionIntent.targets
  );
  if (targetIdsResult instanceof Error) return targetIdsResult;

  let targetIds = targetIdsResult;

  if (targetIds.length === 0) return new CombatActionHitOutcomes();

  const incomingResourceChangesResult = getIncomingResourceChangesPerTarget(context);
  if (incomingResourceChangesResult instanceof Error) return incomingResourceChangesResult;
  const { incomingHpChangePerTargetOption, incomingManaChangePerTargetOption } =
    incomingResourceChangesResult;

  const resourceChanges: {
    incomingChange: { value: number; resourceChangeSource: ResourceChangeSource } | null;
    record: HitPointChanges | ManaChanges;
  }[] = [];

  const hitOutcomes = new CombatActionHitOutcomes();

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

  // while we may have already filtered targets for user selected action while they are targeting,
  // when doing ice burst we still want to target the side combatants, but actually not damage them
  const filteredIdsResult = filterTargetIdGroupByProhibitedCombatantStates(
    party,
    targetIds,
    action.targetingProperties.prohibitedHitCombatantStates
  );

  if (filteredIdsResult instanceof Error) throw filteredIdsResult;
  targetIds = filteredIdsResult;

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
      hitOutcomeProperties.getIsParryable(user) &&
      CombatantProperties.canParry(target) &&
      !targetWantsToBeHit
    ) {
      const percentChanceToParry = getParryChance(user, target);
      const parryRoll = randBetween(0, 100);
      const isParried = parryRoll < percentChanceToParry;
      if (isParried) {
        hitOutcomes.insertOutcomeFlag(HitOutcome.Parry, id);
        continue;
      }
    }

    // COUNTERATTACKS
    if (hitOutcomeProperties.getCanTriggerCounterattack(user) && !targetWantsToBeHit) {
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
        hitOutcomeProperties.getIsBlockable(user) &&
        CombatantProperties.canBlock(target) &&
        !targetWantsToBeHit // this should be checking if actions with malicious intent are in fact healing the target
      ) {
        const percentChanceToBlock = getShieldBlockChance(user, target);
        const blockRoll = randBetween(0, 100);
        const isBlocked = blockRoll < percentChanceToBlock;
        if (isBlocked) {
          hitOutcomes.insertOutcomeFlag(HitOutcome.ShieldBlock, id);

          blockDamageReductionNormalizedPercentage = getShieldBlockDamageReduction(target);
        }
      }
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

      resourceChangeCalculationContext.applyArmorClass(
        hitOutcomeProperties,
        resourceChange,
        user,
        target
      );
      resourceChangeCalculationContext.applyResilience(resourceChange, user, target);

      resourceChange.value = Math.floor(resourceChange.value);

      incomingResourceChangeOption.record.addRecord(id, resourceChange);
    }
  }

  return hitOutcomes;
}

export interface ResourceChangesPerTarget {
  value: number;
  resourceChangeSource: ResourceChangeSource;
}

export function getIncomingResourceChangePerTarget(
  targetIds: EntityId[],
  resourceChangeProperties: CombatActionResourceChangeProperties | null
): null | ResourceChangesPerTarget {
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

export function getIncomingResourceChangesPerTarget(context: ActionResolutionStepContext):
  | Error
  | {
      incomingHpChangePerTargetOption: ResourceChangesPerTarget | null;
      incomingManaChangePerTargetOption: ResourceChangesPerTarget | null;
    } {
  const targetingCalculator = new TargetingCalculator(context.combatantContext, null);
  const { actionExecutionIntent } = context.tracker;
  const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
  const { hitOutcomeProperties } = action;
  const { party, combatant } = context.combatantContext;
  const { combatantProperties: user } = combatant;

  // we need a target to check against to find the best affinity to choose
  // so we'll use the first target for now, until a better system comes to light
  const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
    party,
    actionExecutionIntent
  );
  if (primaryTargetResult instanceof Error)
    return new Error("no target combatant found" + primaryTargetResult.message);

  const target = primaryTargetResult;

  const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
    action,
    actionExecutionIntent.targets
  );
  if (targetIdsResult instanceof Error) return targetIdsResult;

  let targetIds = targetIdsResult;

  const actionHpChangePropertiesOption = cloneDeep(
    hitOutcomeProperties.getHpChangeProperties(user, target.combatantProperties)
  );
  const actionManaChangePropertiesOption = cloneDeep(
    hitOutcomeProperties.getManaChangeProperties(user, target.combatantProperties)
  );

  const incomingHpChangePerTargetOption = getIncomingResourceChangePerTarget(
    targetIds,
    actionHpChangePropertiesOption
  );

  const incomingManaChangePerTargetOption = getIncomingResourceChangePerTarget(
    targetIds,
    actionManaChangePropertiesOption
  );

  return { incomingHpChangePerTargetOption, incomingManaChangePerTargetOption };
}

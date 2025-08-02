import cloneDeep from "lodash.clonedeep";
import { iterateNumericEnumKeyedRecord, randBetween, throwIfError } from "../../../utils/index.js";
import { HP_CALCLULATION_CONTEXTS } from "./hp-change-calculation-strategies/index.js";
import { ResourceChange } from "../../hp-change-source-types.js";
import { applyCritMultiplier } from "./apply-crit-multiplier-to-hp-change.js";
import { EntityId } from "../../../primatives/index.js";
import { convertResourceChangeValueToFinalSign } from "../../combat-actions/action-calculation-utils/convert-hp-change-value-to-final-sign.js";
import {
  applyElementalAffinities,
  applyKineticAffinities,
} from "../../combat-actions/action-calculation-utils/apply-affinities-to-hp-change.js";
import { getActionCritChance } from "./get-action-crit-chance.js";
import { TargetingCalculator } from "../../targeting/targeting-calculator.js";
import { ActionResolutionStepContext } from "../../../action-processing/index.js";
export * from "./hit-outcome-mitigation-calculator.js";
export * from "./incoming-resource-change-calculator.js";
export * from "./get-action-crit-chance.js";
export * from "./hp-change-calculation-strategies/index.js";
export * from "./check-if-target-wants-to-be-hit.js";
export * from "./resource-changes.js";

import { DurabilityChangesByEntityId } from "../../../durability/index.js";
import { HitOutcome } from "../../../hit-outcome.js";
import { HitPointChanges, ManaChanges, ResourceChanges } from "./resource-changes.js";
import { COMBAT_ACTIONS } from "../../combat-actions/action-implementations/index.js";
import { getShieldBlockDamageReduction } from "./shield-blocking.js";
import { RandomNumberGenerator } from "../../../utility-classes/randomizers.js";
import { IncomingResourceChangesCalculator } from "./incoming-resource-change-calculator.js";
import { TargetFilterer } from "../../targeting/filtering.js";
import { CombatActionComponent } from "../../combat-actions/index.js";
import { AdventuringParty } from "../../../adventuring-party/index.js";
import { CombatActionResource } from "../../combat-actions/combat-action-hit-outcome-properties.js";
import { HitOutcomeMitigationCalculator } from "./hit-outcome-mitigation-calculator.js";

export class CombatActionHitOutcomes {
  resourceChanges?: Partial<Record<CombatActionResource, ResourceChanges<ResourceChange>>>;
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

export class HitOutcomeCalculator {
  targetingCalculator: TargetingCalculator;
  incomingResourceChangesCalculator: IncomingResourceChangesCalculator;
  targetIds: EntityId[];
  action: CombatActionComponent;
  constructor(
    private context: ActionResolutionStepContext,
    private rng: RandomNumberGenerator
  ) {
    this.targetingCalculator = new TargetingCalculator(context.combatantContext, null);

    const { actionExecutionIntent } = context.tracker;
    this.action = COMBAT_ACTIONS[actionExecutionIntent.actionName];

    this.targetIds = throwIfError(
      this.targetingCalculator.getCombatActionTargetIds(this.action, actionExecutionIntent.targets)
    );

    this.incomingResourceChangesCalculator = new IncomingResourceChangesCalculator(
      context,
      this.targetingCalculator,
      this.targetIds,
      rng
    );
  }

  calculateHitOutcomes() {
    const { party, combatant } = this.context.combatantContext;

    // while we may have already filtered targets for user selected action while they are targeting,
    // when doing ice burst we still want to target the side combatants, but actually not damage them
    const filteredTargetIds = throwIfError(
      TargetFilterer.filterTargetIdGroupByProhibitedCombatantStates(
        party,
        this.targetIds,
        this.action.targetingProperties.prohibitedHitCombatantStates
      )
    );

    const hitOutcomes = new CombatActionHitOutcomes();

    const incomingResourceChangesPerTarget =
      this.incomingResourceChangesCalculator.getBaseIncomingResourceChangesPerTarget();

    let mitigationCalculator: null | HitOutcomeMitigationCalculator = null;

    for (const targetId of filteredTargetIds) {
      const targetCombatant = AdventuringParty.getExpectedCombatant(party, targetId);
      if (mitigationCalculator === null)
        mitigationCalculator = new HitOutcomeMitigationCalculator(
          this.action,
          combatant,
          targetCombatant,
          incomingResourceChangesPerTarget,
          this.rng
        );
      else mitigationCalculator.setTargetCombatant(targetCombatant);

      const hitOutcomeFlags = mitigationCalculator.rollHitMitigationEvents();
      let wasHit = false;
      for (const flag of hitOutcomeFlags) {
        hitOutcomes.insertOutcomeFlag(flag, targetId);
        if (flag === HitOutcome.Hit) wasHit = true;
      }

      if (wasHit && incomingResourceChangesPerTarget !== null) {
        for (const [resourceType, incomingResourceChangeOption] of iterateNumericEnumKeyedRecord(
          incomingResourceChangesPerTarget
        )) {
          const { valuePerTarget: value, source } = incomingResourceChangeOption;

          const resourceChange = new ResourceChange(value, cloneDeep(resourceChangeSource));

          const percentChanceToCrit = getActionCritChance(action, user, target, targetWantsToBeHit);

          resourceChange.isCrit = randBetween(0, 100, rng) < percentChanceToCrit;
          applyCritMultiplier(resourceChange, action, user, target);
          applyKineticAffinities(resourceChange, target, targetWantsToBeHit);
          applyElementalAffinities(resourceChange, target, targetWantsToBeHit);

          // @TODO
          // apply block mitigation if blocked
          if (blockDamageReductionNormalizedPercentage) {
            const damageReduced = resourceChange.value * blockDamageReductionNormalizedPercentage;
            const damageAdjustedForBlock = resourceChange.value - damageReduced;
            resourceChange.value = Math.max(0, damageAdjustedForBlock);
          }

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
    }
  }
}

import { ActionResolutionStepContext } from "../../../action-processing/index.js";
import { EntityId } from "../../../primatives/index.js";
import { iterateNumericEnumKeyedRecord, randBetween, throwIfError } from "../../../utils/index.js";
import { COMBAT_ACTIONS } from "../../combat-actions/action-implementations/index.js";
import { TargetingCalculator } from "../../targeting/targeting-calculator.js";
import { RandomNumberGenerator } from "../../../utility-classes/randomizers.js";
import { ResourceChangeSource } from "../../hp-change-source-types.js";
import { CombatActionResourceChangeProperties } from "../../combat-actions/combat-action-resource-change-properties.js";
import { MULTI_TARGET_RESOURCE_CHANGE_BONUS } from "../../../app-consts.js";
import {
  CombatActionHitOutcomeProperties,
  CombatActionResource,
} from "../../combat-actions/combat-action-hit-outcome-properties.js";
import { CombatantProperties } from "../../../combatants/index.js";

export interface ResourceChangesPerTarget {
  value: number;
  resourceChangeSource: ResourceChangeSource;
}

export class IncomingResourceChangesCalculator {
  constructor(
    private context: ActionResolutionStepContext,
    private targetingCalculator: TargetingCalculator,
    private targetIds: EntityId[],
    private rng: RandomNumberGenerator
  ) {}

  getBaseIncomingResourceChangesPerTarget() {
    const { actionExecutionIntent } = this.context.tracker;
    const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
    const { party, combatant } = this.context.combatantContext;

    // we need a target to check against to find the best affinity to choose
    // so we'll use the first target for now, until a better system comes to light
    const primaryTargetResult = throwIfError(
      this.targetingCalculator.getPrimaryTargetCombatant(party, actionExecutionIntent)
    );
    const primaryTarget = primaryTargetResult;

    const { hitOutcomeProperties } = action;
    const { combatantProperties: user } = combatant;

    return this.rollBaseIncomingResourceChangesPerTarget(
      user,
      primaryTarget.combatantProperties,
      hitOutcomeProperties
    );
  }

  rollBaseIncomingResourceChangesPerTarget(
    user: CombatantProperties,
    primaryTarget: CombatantProperties,
    hitOutcomeProperties: CombatActionHitOutcomeProperties
  ) {
    const { resourceChangePropertiesGetters } = hitOutcomeProperties;

    const incomingResourceChangesPerTarget: Partial<
      Record<CombatActionResource, { valuePerTarget: number; source: ResourceChangeSource }>
    > = {};

    for (const [actionResource, getter] of iterateNumericEnumKeyedRecord(
      resourceChangePropertiesGetters
    )) {
      const resourceChangeProperties = getter(user, primaryTarget);
      if (resourceChangeProperties === null) continue;
      const rolled = this.rollIncomingResourceChangeBaseValue(resourceChangeProperties, this.rng);
      const valuePerTarget = this.getIncomingResourceChangeValuePerTarget(rolled);

      incomingResourceChangesPerTarget[actionResource] = {
        valuePerTarget,
        source: resourceChangeProperties.resourceChangeSource,
      };
    }

    return incomingResourceChangesPerTarget;
  }

  rollIncomingResourceChangeBaseValue(
    resourceChangeProperties: CombatActionResourceChangeProperties,
    rng: RandomNumberGenerator
  ) {
    const { min, max } = resourceChangeProperties.baseValues;
    return randBetween(min, max, rng);
  }

  getIncomingResourceChangeValuePerTarget(rolledBaseValue: number): number {
    const numberOfTargets = this.targetIds.length;

    return IncomingResourceChangesCalculator.splitResourceChangeWithMultiTargetBonus(
      rolledBaseValue,
      numberOfTargets,
      MULTI_TARGET_RESOURCE_CHANGE_BONUS
    );
  }

  static splitResourceChangeWithMultiTargetBonus(
    resourceChangeValue: number,
    targetsCount: number,
    bonus: number
  ): number {
    const multiTargetBonus = 1 + (targetsCount - 1) * bonus;
    const valueWithBonus = resourceChangeValue * multiTargetBonus;
    return valueWithBonus / targetsCount;
  }
}

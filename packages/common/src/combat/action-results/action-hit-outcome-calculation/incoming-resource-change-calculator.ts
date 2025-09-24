import { EntityId } from "../../../primatives/index.js";
import { iterateNumericEnumKeyedRecord, randBetween } from "../../../utils/index.js";
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
import { CombatActionExecutionIntent } from "../../combat-actions/combat-action-execution-intent.js";
import cloneDeep from "lodash.clonedeep";
import { IActionUser } from "../../../action-user-context/action-user.js";
import { ActionUserContext } from "../../../action-user-context/index.js";

export interface ResourceChangesPerTarget {
  value: number;
  resourceChangeSource: ResourceChangeSource;
}

export class IncomingResourceChangesCalculator {
  constructor(
    private actionUserContext: ActionUserContext,
    private actionExecutionIntent: CombatActionExecutionIntent,
    private targetingCalculator: TargetingCalculator,
    private targetIds: EntityId[],
    private rng: RandomNumberGenerator
  ) {}

  getBaseIncomingResourceChangesPerTarget() {
    const action = COMBAT_ACTIONS[this.actionExecutionIntent.actionName];
    const { party, actionUser } = this.actionUserContext;

    // we need a target to check against to find the best affinity to choose
    // so we'll use the first target for now, until a better system comes to light
    const primaryTargetResult = this.targetingCalculator.getPrimaryTargetCombatant(
      party,
      this.actionExecutionIntent
    );
    // it is possible no target will be found, such as an ice burst with no side targets like when they run
    // through a firewall or are killed by ranged while under shatterable condition with no one nearby to hit
    if (primaryTargetResult instanceof Error) return {};
    const primaryTarget = primaryTargetResult;

    const { hitOutcomeProperties } = action;

    return this.rollBaseIncomingResourceChangesPerTarget(
      actionUser,
      this.actionExecutionIntent.rank,
      primaryTarget.combatantProperties,
      hitOutcomeProperties
    );
  }

  rollBaseIncomingResourceChangesPerTarget(
    user: IActionUser,
    actionLevel: number,
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
      const resourceChangeProperties = getter(
        user,
        hitOutcomeProperties,
        actionLevel,
        primaryTarget
      );
      if (resourceChangeProperties === null) continue;

      // some actions have a base multiplier, such as offhand attack
      const modified = cloneDeep(resourceChangeProperties);
      modified.baseValues.mult(hitOutcomeProperties.resourceChangeValuesModifier);

      const rolled = this.rollIncomingResourceChangeBaseValue(modified, this.rng);
      const valuePerTarget = this.getIncomingResourceChangeValuePerTarget(rolled);

      incomingResourceChangesPerTarget[actionResource] = {
        valuePerTarget,
        source: resourceChangeProperties.resourceChangeSource,
      };
    }

    if (Object.values(incomingResourceChangesPerTarget).length === 0) return null;

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

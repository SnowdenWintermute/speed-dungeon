import {
  CombatActionComponent,
  CombatActionResource,
  Combatant,
  HitOutcomeMitigationCalculator,
  NumberRange,
  ResourceChange,
  ResourceChangeModifier,
  ResourceChangePropertiesStrategy,
  ResourceChangeSource,
} from "@speed-dungeon/common";

const TARGET_ATTEMPTS_MITIGATION = true;
const WAS_BLOCKED = false;

interface WeightedRoll {
  damage: number;
  weight: number;
}

/** Damage is sampled rather than averaged because getDamageAfterArmorClass is convex in damage, so
 * the mean of the range pushed through it understates the true expectation. Crits are sampled for
 * the same reason: applyCritMultiplier runs before applyArmorClass, so a crit enters the convex
 * function as a larger number and penetrates better than a flat multiplier on the mean implies. */
export class ExpectedDamageCalculator {
  constructor(
    private readonly resourceChangePropertiesStrategy: ResourceChangePropertiesStrategy,
    private readonly sampleCount: number
  ) {}

  against(
    action: CombatActionComponent,
    actionRank: number,
    user: Combatant,
    target: Combatant
  ): number {
    const targetProperties = target.combatantProperties;
    const { hitOutcomeProperties } = action;

    const getResourceChangeProperties =
      this.resourceChangePropertiesStrategy.getResourceChangePropertiesGetters(action.name)[
        CombatActionResource.HitPoints
      ];
    if (getResourceChangeProperties === undefined) {
      return 0;
    }

    const resourceChangeProperties = getResourceChangeProperties(
      user,
      hitOutcomeProperties,
      actionRank,
      targetProperties
    );
    if (resourceChangeProperties === null) {
      return 0;
    }

    const { baseValues, resourceChangeSource } = resourceChangeProperties;

    // the game rolls this as a threshold against a uniform roll, so it saturates at 1; left as a
    // bare multiplier it would keep paying for accuracy above evasion + 100, which lands nothing
    const hitChance = Math.min(
      1,
      HitOutcomeMitigationCalculator.getActionHitChance(
        action,
        user,
        actionRank,
        TARGET_ATTEMPTS_MITIGATION,
        targetProperties
      ).afterEvasion
    );

    const critChance = HitOutcomeMitigationCalculator.getActionCritChance(
      action,
      actionRank,
      user,
      targetProperties,
      TARGET_ATTEMPTS_MITIGATION,
      CombatActionResource.HitPoints,
      resourceChangeSource
    );

    const modifier = new ResourceChangeModifier(
      hitOutcomeProperties,
      user,
      targetProperties,
      TARGET_ATTEMPTS_MITIGATION,
      new ResourceChange(0, resourceChangeSource)
    );

    let mitigated = 0;
    for (const { damage, weight } of this.sampleRolls(baseValues)) {
      const onNormalHit = this.mitigate(modifier, resourceChangeSource, damage, false, actionRank);
      const onCrit = this.mitigate(modifier, resourceChangeSource, damage, true, actionRank);
      mitigated += weight * (onNormalHit * (1 - critChance) + onCrit * critChance);
    }

    return hitChance * mitigated;
  }

  private mitigate(
    modifier: ResourceChangeModifier,
    resourceChangeSource: ResourceChangeSource,
    damage: number,
    isCrit: boolean,
    actionRank: number
  ) {
    const resourceChange = new ResourceChange(damage, resourceChangeSource, isCrit);
    modifier.setResourceChange(resourceChange);
    modifier.applyPostHitModifiers(WAS_BLOCKED, actionRank);
    return Math.abs(resourceChange.value);
  }

  /** Midpoint rule, so the result is deterministic and metrics stay a pure function. */
  private sampleRolls(baseValues: NumberRange): WeightedRoll[] {
    const { min, max } = baseValues;
    if (min === max) {
      return [{ damage: min, weight: 1 }];
    }

    const stepSize = (max - min) / this.sampleCount;
    return Array.from({ length: this.sampleCount }, (_, index) => ({
      damage: min + stepSize * (index + 0.5),
      weight: 1 / this.sampleCount,
    }));
  }
}

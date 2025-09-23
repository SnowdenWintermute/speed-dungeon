import { HP_CALCLULATION_CONTEXTS } from "./hp-change-calculation-strategies/index.js";
import { ResourceChange } from "../../hp-change-source-types.js";
import { CombatantProperties, CombatantTraitType } from "../../../combatants/index.js";
import { Percentage } from "../../../primatives/index.js";
import { HitOutcomeMitigationCalculator } from "./hit-outcome-mitigation-calculator.js";
import { CombatActionHitOutcomeProperties } from "../../combat-actions/combat-action-hit-outcome-properties.js";
import { IActionUser } from "../../../combatant-context/action-user.js";

export class ResourceChangeModifier {
  constructor(
    private hitOutcomeProperties: CombatActionHitOutcomeProperties,
    private user: IActionUser,
    private target: CombatantProperties,
    private targetWillAttemptMitigation: boolean,
    private resourceChange: ResourceChange
  ) {}

  setResourceChange(resourceChange: ResourceChange) {
    this.resourceChange = resourceChange;
  }

  applyPostHitModifiers(wasBlocked: boolean, actionLevel: number) {
    const { hitOutcomeProperties, resourceChange, user, target } = this;

    this.applyCritMultiplier(actionLevel);
    this.applyKineticAffinities();
    this.applyElementalAffinities();
    if (wasBlocked) this.applyShieldBlock();

    this.convertResourceChangeValueToFinalSign();

    const resourceChangeCalculationContext =
      HP_CALCLULATION_CONTEXTS[this.resourceChange.source.category];

    resourceChangeCalculationContext.applyArmorClass(
      hitOutcomeProperties,
      resourceChange,
      user,
      actionLevel,
      target
    );
    resourceChangeCalculationContext.applyResilience(resourceChange, user, target);

    this.resourceChange.value = Math.floor(resourceChange.value);
  }

  private applyCritMultiplier(actionLevel: number) {
    if (!this.resourceChange.isCrit) return;
    let critMultiplier = this.hitOutcomeProperties.getCritMultiplier(this.user, actionLevel);
    if (critMultiplier === null) critMultiplier = 1;

    this.resourceChange.value *= critMultiplier;
  }

  private applyShieldBlock() {
    const blockDamageReductionNormalizedPercentage =
      HitOutcomeMitigationCalculator.getShieldBlockDamageReduction(this.target);
    const damageReduced = this.resourceChange.value * blockDamageReductionNormalizedPercentage;
    const damageAdjustedForBlock = this.resourceChange.value - damageReduced;
    this.resourceChange.value = Math.max(0, damageAdjustedForBlock);
  }

  private applyElementalAffinities() {
    const hpChangeElement = this.resourceChange.source.elementOption;
    if (hpChangeElement === undefined) return;
    const targetAffinities = CombatantProperties.getCombatantTotalElementalAffinities(this.target);
    const affinityValue = targetAffinities[hpChangeElement] || 0;
    const afterAffinityApplied = this.applyAffinity(affinityValue);
    // target wanted to be hit, so don't reduce the incoming value
    if (
      Math.abs(afterAffinityApplied) < Math.abs(this.resourceChange.value) &&
      !this.targetWillAttemptMitigation
    )
      return;
    this.resourceChange.value = this.applyAffinity(affinityValue);
  }

  private applyKineticAffinities() {
    const kineticDamageType = this.resourceChange.source.kineticDamageTypeOption;
    if (kineticDamageType === undefined) return;
    const targetAffinities = CombatantProperties.getCombatantTotalKineticDamageTypeAffinities(
      this.target
    );
    const affinityValue: Percentage = targetAffinities[kineticDamageType] || 0;

    const afterAffinityApplied = this.applyAffinity(affinityValue);
    // target wanted to be hit, so don't reduce the incoming value
    if (
      Math.abs(afterAffinityApplied) < Math.abs(this.resourceChange.value) &&
      !this.targetWillAttemptMitigation
    )
      return;
    this.resourceChange.value = this.applyAffinity(affinityValue);
  }

  private applyAffinity(affinityPercentage: number): number {
    if (affinityPercentage < 0) {
      // Takes extra damage
      const multiplier = 1 + Math.abs(affinityPercentage) / 100;
      return this.resourceChange.value * multiplier;
    } else if (affinityPercentage <= 100) {
      // Takes reduced damage
      const multiplier = 1 - affinityPercentage / 100;
      return this.resourceChange.value * multiplier;
    } else {
      // Takes healing instead of damage
      const capped = Math.min(affinityPercentage, 200);
      const multiplier = (capped - 100) / 100;
      return -this.resourceChange.value * multiplier;
    }
  }

  convertResourceChangeValueToFinalSign() {
    const targetIsUndead = CombatantProperties.hasTraitType(this.target, CombatantTraitType.Undead);
    // if it wasn't intended as healing, but is actually healing target due to affinities,
    // don't "un healify" the hp change here
    const { resourceChange } = this;
    const targetIsBeingHealedFromAffinities = resourceChange.value > 0;

    const shouldKeepSign =
      resourceChange.source.isHealing && targetIsBeingHealedFromAffinities && !targetIsUndead;

    if (!shouldKeepSign) resourceChange.value *= -1;
  }
}

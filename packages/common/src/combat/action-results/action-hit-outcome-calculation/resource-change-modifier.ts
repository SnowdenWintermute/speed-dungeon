import { HP_CALCLULATION_CONTEXTS } from "./hp-change-calculation-strategies/index.js";
import { ResourceChange } from "../../hp-change-source-types.js";
import { Combatant, CombatantProperties, CombatantTraitType } from "../../../combatants/index.js";
import { CombatActionComponent } from "../../combat-actions/index.js";
import { Percentage } from "../../../primatives/index.js";
import { HitOutcomeMitigationCalculator } from "./hit-outcome-mitigation-calculator.js";

export class ResourceChangeModifier {
  constructor(
    private action: CombatActionComponent,
    private user: Combatant,
    private targetCombatant: Combatant,
    private targetWillAttemptMitigation: boolean,
    private resourceChange: ResourceChange
  ) {}

  applyPostHitModifiers(wasBlocked: boolean) {
    const { action } = this;
    const user = this.user.combatantProperties;
    const target = this.targetCombatant.combatantProperties;

    this.applyCritMultiplier();
    this.applyKineticAffinities();
    this.applyElementalAffinities();
    if (wasBlocked) this.applyShieldBlock();

    this.convertResourceChangeValueToFinalSign();

    const resourceChangeCalculationContext =
      HP_CALCLULATION_CONTEXTS[this.resourceChange.source.category];

    resourceChangeCalculationContext.applyArmorClass(
      action.hitOutcomeProperties,
      this.resourceChange,
      user,
      target
    );
    resourceChangeCalculationContext.applyResilience(this.resourceChange, user, target);

    this.resourceChange.value = Math.floor(this.resourceChange.value);
  }

  private applyCritMultiplier() {
    if (!this.resourceChange.isCrit) return;
    const critMultiplier = this.action.hitOutcomeProperties.getCritMultiplier(
      this.user.combatantProperties
    );
    this.resourceChange.value *= critMultiplier;
  }

  private applyShieldBlock() {
    const blockDamageReductionNormalizedPercentage =
      HitOutcomeMitigationCalculator.getShieldBlockDamageReduction(
        this.targetCombatant.combatantProperties
      );
    const damageReduced = this.resourceChange.value * blockDamageReductionNormalizedPercentage;
    const damageAdjustedForBlock = this.resourceChange.value - damageReduced;
    this.resourceChange.value = Math.max(0, damageAdjustedForBlock);
  }

  private applyElementalAffinities() {
    const hpChangeElement = this.resourceChange.source.elementOption;
    if (hpChangeElement === undefined) return;
    const targetAffinities = CombatantProperties.getCombatantTotalElementalAffinities(
      this.targetCombatant.combatantProperties
    );
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
      this.targetCombatant.combatantProperties
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

  private convertResourceChangeValueToFinalSign() {
    const targetIsUndead = CombatantProperties.hasTraitType(
      this.targetCombatant.combatantProperties,
      CombatantTraitType.Undead
    );
    // if it wasn't intended as healing, but is actually healing target due to affinities,
    // don't "un healify" the hp change here
    const { resourceChange } = this;
    const targetIsBeingHealedFromAffinities = resourceChange.value > 0;

    const shouldKeepSign =
      resourceChange.source.isHealing && targetIsBeingHealedFromAffinities && !targetIsUndead;

    if (!shouldKeepSign) resourceChange.value *= -1;
  }
}

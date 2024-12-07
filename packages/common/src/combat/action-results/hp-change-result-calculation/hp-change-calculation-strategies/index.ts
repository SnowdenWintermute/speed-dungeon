export * from "./generic-hp-calculation-strategy.js";
export * from "./magical-hp-change-calulation-strategy.js";
export * from "./physical-hp-change-calculation-strategy.js";
import {
  MagicalHpChangeCalculationStrategy,
  PhysicalHpChangeCalculationStrategy,
} from "../index.js";
import { CombatantProperties } from "../../../../combatants/index.js";
import { CombatActionHpChangeProperties } from "../../../combat-actions";
import { HpChange, HpChangeSourceCategory } from "../../../hp-change-source-types.js";

export interface HpChangeCalculationStrategy {
  rollHit(
    userCombatantProperties: CombatantProperties,
    targetCombatantProperties: CombatantProperties,
    unavoidable: boolean,
    targetWantsToBeHit: boolean
  ): boolean;
  rollCrit(
    hpChange: HpChange,
    user: CombatantProperties,
    target: CombatantProperties,
    targetWantsToBeHit: boolean
  ): HpChange;
  applyCritMultiplier(
    hpChange: HpChange,
    hpChangeProperties: CombatActionHpChangeProperties,
    user: CombatantProperties,
    target: CombatantProperties
  ): HpChange;
  applyKineticAffinities(hpChange: HpChange, target: CombatantProperties): HpChange;
  applyElementalAffinities(hpChange: HpChange, target: CombatantProperties): HpChange;
  applyArmorClass(
    hpChange: HpChange,
    user: CombatantProperties,
    target: CombatantProperties
  ): HpChange;
  applyResilience(
    hpChange: HpChange,
    user: CombatantProperties,
    target: CombatantProperties
  ): HpChange;
}

export class HpChangeCalulationContext implements HpChangeCalculationStrategy {
  private strategy: HpChangeCalculationStrategy;

  constructor(hpChangeSourceCategory: HpChangeSourceCategory) {
    this.strategy = this.createStrategy(hpChangeSourceCategory);
  }
  rollHit(
    userCombatantProperties: CombatantProperties,
    targetCombatantProperties: CombatantProperties,
    isAvoidable: boolean,
    targetWantsToBeHit: boolean
  ): boolean {
    return this.strategy.rollHit(
      userCombatantProperties,
      targetCombatantProperties,
      isAvoidable,
      targetWantsToBeHit
    );
  }
  rollCrit(
    hpChange: HpChange,
    user: CombatantProperties,
    target: CombatantProperties,
    targetWantsToBeHit: boolean
  ): HpChange {
    return this.strategy.rollCrit(hpChange, user, target, targetWantsToBeHit);
  }
  applyCritMultiplier(
    hpChange: HpChange,
    hpChangeProperties: CombatActionHpChangeProperties,
    user: CombatantProperties,
    target: CombatantProperties
  ): HpChange {
    return this.strategy.applyCritMultiplier(hpChange, hpChangeProperties, user, target);
  }
  applyKineticAffinities(hpChange: HpChange, target: CombatantProperties): HpChange {
    return this.strategy.applyKineticAffinities(hpChange, target);
  }
  applyElementalAffinities(hpChange: HpChange, target: CombatantProperties): HpChange {
    return this.strategy.applyElementalAffinities(hpChange, target);
  }
  applyArmorClass(
    hpChange: HpChange,
    user: CombatantProperties,
    target: CombatantProperties
  ): HpChange {
    return this.strategy.applyArmorClass(hpChange, user, target);
  }
  applyResilience(
    hpChange: HpChange,
    user: CombatantProperties,
    target: CombatantProperties
  ): HpChange {
    return this.strategy.applyResilience(hpChange, user, target);
  }

  private createStrategy(
    hpChangeSourceCategory: HpChangeSourceCategory
  ): HpChangeCalculationStrategy {
    switch (hpChangeSourceCategory) {
      case HpChangeSourceCategory.Physical:
        return new PhysicalHpChangeCalculationStrategy();
      case HpChangeSourceCategory.Magical:
        return new MagicalHpChangeCalculationStrategy();
      case HpChangeSourceCategory.Medical:
        return new MagicalHpChangeCalculationStrategy();
      case HpChangeSourceCategory.Direct:
        return new MagicalHpChangeCalculationStrategy();
    }
  }
}

export const HP_CALCLULATION_CONTEXTS: Record<HpChangeSourceCategory, HpChangeCalulationContext> = {
  [HpChangeSourceCategory.Physical]: new HpChangeCalulationContext(HpChangeSourceCategory.Physical),
  [HpChangeSourceCategory.Magical]: new HpChangeCalulationContext(HpChangeSourceCategory.Magical),
  [HpChangeSourceCategory.Medical]: new HpChangeCalulationContext(HpChangeSourceCategory.Medical),
  [HpChangeSourceCategory.Direct]: new HpChangeCalulationContext(HpChangeSourceCategory.Direct),
};

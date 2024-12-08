export * from "./magical-hp-change-calulation-strategy.js";
export * from "./physical-hp-change-calculation-strategy.js";
import { CombatantProperties } from "../../../../combatants/index.js";
import { HpChange, HpChangeSourceCategory } from "../../../hp-change-source-types.js";
import { MagicalHpChangeCalculationStrategy } from "./magical-hp-change-calulation-strategy.js";
import { PhysicalHpChangeCalculationStrategy } from "./physical-hp-change-calculation-strategy.js";

export interface HpChangeCalculationStrategy {
  rollCrit(
    hpChange: HpChange,
    user: CombatantProperties,
    target: CombatantProperties,
    targetWantsToBeHit: boolean
  ): void;
  applyArmorClass(hpChange: HpChange, user: CombatantProperties, target: CombatantProperties): void;
  applyResilience(hpChange: HpChange, user: CombatantProperties, target: CombatantProperties): void;
}

export class HpChangeCalulationContext implements HpChangeCalculationStrategy {
  private strategy: HpChangeCalculationStrategy;

  constructor(hpChangeSourceCategory: HpChangeSourceCategory) {
    this.strategy = this.createStrategy(hpChangeSourceCategory);
  }
  rollCrit(
    hpChange: HpChange,
    user: CombatantProperties,
    target: CombatantProperties,
    targetWantsToBeHit: boolean
  ) {
    return this.strategy.rollCrit(hpChange, user, target, targetWantsToBeHit);
  }
  applyArmorClass(hpChange: HpChange, user: CombatantProperties, target: CombatantProperties) {
    return this.strategy.applyArmorClass(hpChange, user, target);
  }
  applyResilience(hpChange: HpChange, user: CombatantProperties, target: CombatantProperties) {
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

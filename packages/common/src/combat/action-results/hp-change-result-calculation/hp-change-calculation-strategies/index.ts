import { HpChange } from "../";
import { CombatantProperties } from "../../../../combatants/index.js";
import { CombatActionHpChangeProperties } from "../../../combat-actions";
import { HpChangeSourceCategory } from "../../../hp-change-source-types.js";
import MagicalDamageHpCalculationStrategy from "./magical-damage-hp-calulation-strategy";

export interface HpChangeCalculationStrategy {
  rollCrit(hpChange: HpChange, user: CombatantProperties, target: CombatantProperties): HpChange;
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

export default class HpChangeCalulationContext implements HpChangeCalculationStrategy {
  private strategy: HpChangeCalculationStrategy;

  constructor(hpChangeSourceCategory: HpChangeSourceCategory) {
    this.strategy = this.createStrategy(hpChangeSourceCategory);
  }
  rollCrit(hpChange: HpChange, user: CombatantProperties, target: CombatantProperties): HpChange {
    return this.strategy.rollCrit(hpChange, user, target);
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
    throw new Error("Method not implemented.");
  }

  private createStrategy(
    hpChangeSourceCategory: HpChangeSourceCategory
  ): HpChangeCalculationStrategy {
    //
    switch (hpChangeSourceCategory) {
      case HpChangeSourceCategory.Physical:
      case HpChangeSourceCategory.Magical:
      case HpChangeSourceCategory.Medical:
      case HpChangeSourceCategory.Direct:
    }

    return new MagicalDamageHpCalculationStrategy();
  }
}
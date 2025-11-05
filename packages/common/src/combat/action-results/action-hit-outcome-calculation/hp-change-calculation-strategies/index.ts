export * from "./magical-hp-change-calulation-strategy.js";
export * from "./physical-hp-change-calculation-strategy.js";
import { IActionUser } from "../../../../action-user-context/action-user.js";
import { CombatantProperties } from "../../../../combatants/combatant-properties.js";
import { CombatActionHitOutcomeProperties } from "../../../combat-actions/combat-action-hit-outcome-properties.js";
import { ResourceChange, ResourceChangeSourceCategory } from "../../../hp-change-source-types.js";
import { MagicalResourceChangeCalculationStrategy } from "./magical-hp-change-calulation-strategy.js";
import { PhysicalResourceChangeCalculationStrategy } from "./physical-hp-change-calculation-strategy.js";

export interface ResourceChangeCalculationStrategy {
  applyArmorClass(
    hitOutcomeProperties: CombatActionHitOutcomeProperties,
    hpChange: ResourceChange,
    user: IActionUser,
    actionLevel: number,
    target: CombatantProperties
  ): void;
  applyResilience(hpChange: ResourceChange, user: IActionUser, target: CombatantProperties): void;
}

export class ResourceChangeCalulationContext implements ResourceChangeCalculationStrategy {
  private strategy: ResourceChangeCalculationStrategy;

  constructor(hpChangeSourceCategory: ResourceChangeSourceCategory) {
    this.strategy = this.createStrategy(hpChangeSourceCategory);
  }
  applyArmorClass(
    hitOutcomeProperties: CombatActionHitOutcomeProperties,
    hpChange: ResourceChange,
    user: IActionUser,
    actionLevel: number,
    target: CombatantProperties
  ) {
    return this.strategy.applyArmorClass(hitOutcomeProperties, hpChange, user, actionLevel, target);
  }
  applyResilience(hpChange: ResourceChange, user: IActionUser, target: CombatantProperties) {
    return this.strategy.applyResilience(hpChange, user, target);
  }

  private createStrategy(
    hpChangeSourceCategory: ResourceChangeSourceCategory
  ): ResourceChangeCalculationStrategy {
    switch (hpChangeSourceCategory) {
      case ResourceChangeSourceCategory.Physical:
      case ResourceChangeSourceCategory.Medical:
        return new PhysicalResourceChangeCalculationStrategy();
      case ResourceChangeSourceCategory.Magical:
        return new MagicalResourceChangeCalculationStrategy();
      case ResourceChangeSourceCategory.Direct:
        return new MagicalResourceChangeCalculationStrategy();
    }
  }
}

export const HP_CALCLULATION_CONTEXTS: Record<
  ResourceChangeSourceCategory,
  ResourceChangeCalulationContext
> = {
  [ResourceChangeSourceCategory.Physical]: new ResourceChangeCalulationContext(
    ResourceChangeSourceCategory.Physical
  ),
  [ResourceChangeSourceCategory.Magical]: new ResourceChangeCalulationContext(
    ResourceChangeSourceCategory.Magical
  ),
  [ResourceChangeSourceCategory.Medical]: new ResourceChangeCalulationContext(
    ResourceChangeSourceCategory.Medical
  ),
  [ResourceChangeSourceCategory.Direct]: new ResourceChangeCalulationContext(
    ResourceChangeSourceCategory.Direct
  ),
};

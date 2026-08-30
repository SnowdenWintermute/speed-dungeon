import {
  AttributePointAssignableAttributes,
  CombatAttribute,
  Combatant,
  Equipment,
} from "@speed-dungeon/common";
import { GoalPerformanceChecker, GoalPerformanceUnit } from "./index.ts";

/**
 * Read off the equipment rather than off the combatant: a character copying its attributes from
 * another study reports them explicitly, and an explicit total is the specced record alone — worn
 * equipment never reaches it. The static is the right reader anyway. It skips broken items, and it
 * is the one the analysis driver swaps to scale what a party earns.
 */
export class WornArmorClassGoalPerformanceChecker implements GoalPerformanceChecker {
  readonly scoreUnit = GoalPerformanceUnit.WornArmorClass;

  constructor(
    readonly allocatableAttributes: AttributePointAssignableAttributes[],
    readonly equipmentScoreAxes: ((equipment: Equipment) => number)[]
  ) {}

  checkPerformance(combatant: Combatant) {
    return WornArmorClassGoalPerformanceChecker.getWornArmorClass(combatant);
  }

  static getWornArmorClass(combatant: Combatant) {
    const { equipment } = combatant.getCombatantProperties();
    const worn = equipment.getAllEquippedItems({ includeUnselectedHotswapSlots: false });
    return Equipment.getAttributesOnEquipmentList(worn)[CombatAttribute.ArmorClass];
  }
}

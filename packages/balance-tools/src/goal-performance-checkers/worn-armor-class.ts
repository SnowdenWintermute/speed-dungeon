import {
  AttributePointAssignableAttributes,
  CombatAttribute,
  Combatant,
  Equipment,
} from "@speed-dungeon/common";
import { GoalPerformanceChecker } from "./index.ts";

/** read off the equipment rather than off the combatant, whose explicit total is the specced record
 * alone — worn equipment never reaches it */
export class WornArmorClassGoalPerformanceChecker implements GoalPerformanceChecker {
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

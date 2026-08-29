import { Combatant, MapUtils, TargetDummyFactory } from "@speed-dungeon/common";
import { CombatantAttributesMemo } from "../analysis-subjects/combatant-attributes-memo.ts";

/**
 * The dummies every sampling goal measures against. Shared, so two goals scoring in the same unit
 * are scoring against the same target rather than against equal-by-coincidence copies.
 */
export class TargetDummyProvider {
  private targetDummyFactory = new TargetDummyFactory();
  private targetDummiesByFloor = new Map<number, Combatant>();

  requireForFloor(floor: number) {
    return MapUtils.getOrCreate(this.targetDummiesByFloor, floor, () => {
      const targetDummy = this.targetDummyFactory.createOnFloor(floor);
      new CombatantAttributesMemo(targetDummy).holdIndefinitely();
      return targetDummy;
    });
  }
}

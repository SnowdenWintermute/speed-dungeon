import { Combatant, MapUtils, TargetDummyFactory } from "@speed-dungeon/common";
import { CombatantAttributesMemo } from "../analysis-subjects/combatant-attributes-memo.ts";

export class TargetDummyProvider {
  private targetDummyFactory: TargetDummyFactory;
  private targetDummiesByFloor = new Map<number, Combatant>();

  constructor(hasArmorClass: boolean) {
    this.targetDummyFactory = new TargetDummyFactory({ hasArmorClass });
  }

  requireForFloor(floor: number) {
    return MapUtils.getOrCreate(this.targetDummiesByFloor, floor, () => {
      const targetDummy = this.targetDummyFactory.createOnFloor(floor);
      new CombatantAttributesMemo(targetDummy).holdIndefinitely();
      return targetDummy;
    });
  }
}

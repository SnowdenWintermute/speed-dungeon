import { Equipment, EquipmentBaseItem, EquipmentType } from "@speed-dungeon/common";

export class EquipmentSetRequirementThresholds {
  constructor(
    private equipmentWithBestAffixesForChased: Map<EquipmentType, Map<EquipmentBaseItem, Equipment>>
  ) {}

  something() {
    //
  }
}

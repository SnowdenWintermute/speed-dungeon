import { plainToInstance } from "class-transformer";
import { Equipment, EquipmentType, HoldableSlotType } from "../items/equipment/index.js";
import { iterateNumericEnumKeyedRecord } from "../utils/index.js";
import { CombatantSubsystem } from "./combatant-subsystem.js";

export class MitigationProperties extends CombatantSubsystem {
  constructor() {
    super();
  }

  static getDeserialized(self: MitigationProperties) {
    return plainToInstance(MitigationProperties, self);
  }

  canParry(): boolean {
    const combatantProperties = this.getCombatantProperties();
    const holdables = combatantProperties.equipment.getActiveHoldableSlot();
    if (!holdables) return false;
    for (const [slot, equipment] of iterateNumericEnumKeyedRecord(holdables.holdables)) {
      if (slot === HoldableSlotType.OffHand) continue;
      const { equipmentType } = equipment.equipmentBaseItemProperties;
      if (
        equipmentType === EquipmentType.OneHandedMeleeWeapon ||
        equipmentType === EquipmentType.TwoHandedMeleeWeapon
      )
        return true;
    }
    return false;
  }

  canCounterattack(): boolean {
    return true;
  }

  canBlock(): boolean {
    const combatantProperties = this.getCombatantProperties();
    const holdables = combatantProperties.equipment.getActiveHoldableSlot();
    if (!holdables) return false;
    for (const [slot, equipment] of iterateNumericEnumKeyedRecord(holdables.holdables)) {
      if (slot === HoldableSlotType.MainHand) continue;
      const { equipmentType } = equipment.equipmentBaseItemProperties;
      if (equipmentType === EquipmentType.Shield && !Equipment.isBroken(equipment)) return true;
    }
    return false;
  }
}

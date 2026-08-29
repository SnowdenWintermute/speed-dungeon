import {
  Combatant,
  CombatantClass,
  EquipmentSlotId,
  EquipmentType,
  HOLDABLE_EQUIPMENT_TYPES,
  HOLDABLE_SLOT_IDS,
} from "@speed-dungeon/common";
// the workbook sync reaches this module and runs under node's type stripping, which cannot erase a
// type-only export imported as a value
import type { EntityName, Serializable, SerializedOf } from "@speed-dungeon/common";
import { CharacterWeaponSpecialty } from "./character-weapon-specialty.ts";
import { AnalysisGoal } from "../goal-performance-checkers/analysis-goal.ts";

export class AnalysisCharacterSpecification implements Serializable {
  public characterName: EntityName;
  constructor(
    public readonly name: string,
    public readonly characterBuildSpec: CharacterBuildSpecification,
    public readonly goal: AnalysisGoal
  ) {
    this.characterName = name as EntityName;
  }

  toSerialized() {
    return {
      name: this.characterName,
      characterBuildSpec: this.characterBuildSpec,
      goal: this.goal,
    };
  }

  static fromSerialized(serialized: SerializedOf<AnalysisCharacterSpecification>) {
    return new AnalysisCharacterSpecification(
      serialized.name,
      serialized.characterBuildSpec,
      serialized.goal
    );
  }

  combatantIsWearingDesiredEquipmentType(combatant: Combatant) {
    const { equipment } = combatant.getCombatantProperties();
    const mainHandType = equipment.getEquipmentInSlot(EquipmentSlotId.MainHand)
      ?.equipmentBaseItemProperties.equipmentType;
    const offHandType = equipment.getEquipmentInSlot(EquipmentSlotId.OffHand)
      ?.equipmentBaseItemProperties.equipmentType;

    switch (this.characterBuildSpec.weaponSpecialty) {
      case CharacterWeaponSpecialty.TwoHandedMelee:
        return mainHandType === EquipmentType.TwoHandedMeleeWeapon;
      case CharacterWeaponSpecialty.TwoHandedRanged:
        return mainHandType === EquipmentType.TwoHandedRangedWeapon;
      case CharacterWeaponSpecialty.DualWield:
        return (
          (mainHandType === EquipmentType.OneHandedMeleeWeapon || mainHandType === undefined) &&
          (offHandType === EquipmentType.OneHandedMeleeWeapon || offHandType === undefined)
        );
      case CharacterWeaponSpecialty.Shields:
        return offHandType === EquipmentType.Shield;
    }
  }

  /** the holdable types this build competes for, so availability can be reported per build */
  static getUsedHoldableTypes(weaponSpecialty: CharacterWeaponSpecialty) {
    return HOLDABLE_EQUIPMENT_TYPES.filter((equipmentType) =>
      HOLDABLE_SLOT_IDS.some((slotId) =>
        AnalysisCharacterSpecification.wouldConsiderEquipmentTypeInSlot(
          weaponSpecialty,
          equipmentType,
          slotId
        )
      )
    );
  }

  /** not meant to check equipment basic slot compatibility */
  combatantWouldConsiderEquipmentTypeInSlot(equipmentType: EquipmentType, slotId: EquipmentSlotId) {
    return AnalysisCharacterSpecification.wouldConsiderEquipmentTypeInSlot(
      this.characterBuildSpec.weaponSpecialty,
      equipmentType,
      slotId
    );
  }

  static wouldConsiderEquipmentTypeInSlot(
    weaponSpecialty: CharacterWeaponSpecialty,
    equipmentType: EquipmentType,
    slotId: EquipmentSlotId
  ) {
    switch (equipmentType) {
      case EquipmentType.BodyArmor:
      case EquipmentType.HeadGear:
      case EquipmentType.Ring:
      case EquipmentType.Amulet:
        return true;
      case EquipmentType.OneHandedMeleeWeapon:
        if (weaponSpecialty === CharacterWeaponSpecialty.Shields) {
          return slotId !== EquipmentSlotId.OffHand;
        }
        return (
          weaponSpecialty !== CharacterWeaponSpecialty.TwoHandedMelee &&
          weaponSpecialty !== CharacterWeaponSpecialty.TwoHandedRanged
        );
      case EquipmentType.TwoHandedMeleeWeapon:
        return weaponSpecialty === CharacterWeaponSpecialty.TwoHandedMelee;
      case EquipmentType.TwoHandedRangedWeapon:
        return weaponSpecialty === CharacterWeaponSpecialty.TwoHandedRanged;
      case EquipmentType.Shield:
        return weaponSpecialty === CharacterWeaponSpecialty.Shields;
    }
  }
}

export interface CharacterBuildSpecification {
  weaponSpecialty: CharacterWeaponSpecialty;
  mainClass: CombatantClass;
  supportClass: CombatantClass | null;
}

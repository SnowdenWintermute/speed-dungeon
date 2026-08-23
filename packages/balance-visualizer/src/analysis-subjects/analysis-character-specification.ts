import {
  Combatant,
  CombatantClass,
  EntityName,
  EquipmentSlotId,
  EquipmentType,
} from "@speed-dungeon/common";

export class AnalysisCharacterSpecification {
  public characterName: EntityName;
  constructor(
    name: string,
    public readonly characterBuildSpec: CharacterBuildSpecification
  ) {
    this.characterName = name as EntityName;
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

  /** not meant to check equipment basic slot compatibility */
  combatantWouldConsiderEquipmentTypeInSlot(equipmentType: EquipmentType, slotId: EquipmentSlotId) {
    const { weaponSpecialty } = this.characterBuildSpec;
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

export enum CharacterWeaponSpecialty {
  TwoHandedMelee,
  TwoHandedRanged,
  DualWield,
  Shields,
}

export interface CharacterBuildSpecification {
  weaponSpecialty: CharacterWeaponSpecialty;
  mainClass: CombatantClass;
  supportClass: CombatantClass;
}

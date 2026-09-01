import {
  ArrayUtils,
  Combatant,
  CombatantClass,
  COMPATIBLE_ITEMS_BY_SLOT_TYPE,
  EquipmentSlotId,
  EquipmentType,
  HOLDABLE_EQUIPMENT_TYPES,
  HOLDABLE_SLOT_IDS,
  invariant,
  SLOT_TYPE_BY_SLOT_ID,
} from "@speed-dungeon/common";
// the workbook sync reaches this module and runs under node's type stripping, which cannot erase a
// type-only export imported as a value
import type { EntityName, Serializable, SerializedOf } from "@speed-dungeon/common";
import { CharacterWeaponSpecialty } from "./character-weapon-specialty.ts";
import {
  AnalysisGoal,
  ANALYSIS_GOAL_SPECS,
  ANALYSIS_GOAL_STRINGS,
} from "../goal-performance-checkers/analysis-goal.ts";
import { AttributeSourceType } from "./attribute-source.ts";
import type { AttributeSource, CopiedAttributeProfileRoom } from "./attribute-source.ts";

export class AnalysisCharacterSpecification implements Serializable {
  public characterName: EntityName;
  constructor(
    public readonly name: string,
    public readonly characterBuildSpec: CharacterBuildSpecification,
    public readonly goal: AnalysisGoal,
    public readonly attributeSource: AttributeSource
  ) {
    this.characterName = name as EntityName;

    invariant(
      ANALYSIS_GOAL_SPECS[goal].allocatableAttributes.length > 0 ||
        attributeSource.type !== AttributeSourceType.AllocatedTowardGoal,
      `${name} chases ${ANALYSIS_GOAL_STRINGS[goal]}, which has no attributes to allocate ` +
        `toward, so it has to copy them from another study rather than earn them`
    );
  }

  toSerialized() {
    return {
      name: this.characterName,
      characterBuildSpec: this.characterBuildSpec,
      goal: this.goal,
      attributeSource: this.attributeSource,
    };
  }

  static fromSerialized(serialized: SerializedOf<AnalysisCharacterSpecification>) {
    return new AnalysisCharacterSpecification(
      serialized.name,
      serialized.characterBuildSpec,
      serialized.goal,
      serialized.attributeSource
    );
  }

  withCopiedProfileRooms(rooms: CopiedAttributeProfileRoom[]) {
    const { attributeSource } = this;
    invariant(
      attributeSource.type === AttributeSourceType.CopiedFromStudyTable,
      "only a character copying its attributes has profile rooms to fill"
    );

    return new AnalysisCharacterSpecification(this.name, this.characterBuildSpec, this.goal, {
      ...attributeSource,
      rooms,
    });
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
    const compatibleEquipmentTypesInSlot =
      AnalysisCharacterSpecification.equipmentSpecialtyCompatibleEquipmentTypesForSlot(
        weaponSpecialty,
        slotId
      );

    return compatibleEquipmentTypesInSlot.includes(equipmentType);
  }

  static equipmentSpecialtyCompatibleEquipmentTypesForSlot(
    specialty: CharacterWeaponSpecialty,
    slotId: EquipmentSlotId
  ) {
    const slotType = SLOT_TYPE_BY_SLOT_ID[slotId];
    const compatible = [...COMPATIBLE_ITEMS_BY_SLOT_TYPE[slotType]];
    switch (specialty) {
      case CharacterWeaponSpecialty.TwoHandedMelee:
      case CharacterWeaponSpecialty.TwoHandedRanged: {
        if (slotId === EquipmentSlotId.OffHand) {
          compatible.length = 0;
        }
        break;
      }
      case CharacterWeaponSpecialty.DualWield: {
        ArrayUtils.removeElement(compatible, EquipmentType.TwoHandedMeleeWeapon);
        ArrayUtils.removeElement(compatible, EquipmentType.TwoHandedRangedWeapon);
        ArrayUtils.removeElement(compatible, EquipmentType.Shield);
        break;
      }
      case CharacterWeaponSpecialty.Shields: {
        ArrayUtils.removeElement(compatible, EquipmentType.TwoHandedMeleeWeapon);
        ArrayUtils.removeElement(compatible, EquipmentType.TwoHandedRangedWeapon);
        if (slotId === EquipmentSlotId.OffHand) {
          ArrayUtils.removeElement(compatible, EquipmentType.OneHandedMeleeWeapon);
        }
        break;
      }
    }

    return compatible;
  }
}

export interface CharacterBuildSpecification {
  weaponSpecialty: CharacterWeaponSpecialty;
  mainClass: CombatantClass;
  supportClass: CombatantClass | null;
}

import { IconName, KINETIC_TYPE_ICONS, MAGICAL_ELEMENT_ICONS, SVG_ICONS } from "@/app/icons";
import {
  CombatantEquipment,
  CombatantProperties,
  Equipment,
  EquipmentType,
  HoldableSlotType,
  KineticDamageType,
  throwIfError,
} from "@speed-dungeon/common";

export function getAttackActionIcons(user: CombatantProperties, inCombat: boolean) {
  const mhIcons = [];

  const { actionPoints } = user;
  const mainHandEquipmentOption = CombatantEquipment.getEquippedHoldable(
    user.equipment,
    HoldableSlotType.MainHand
  );
  const offHandEquipmentOption = CombatantEquipment.getEquippedHoldable(
    user.equipment,
    HoldableSlotType.OffHand
  );
  const ohIsShield =
    offHandEquipmentOption?.equipmentBaseItemProperties.equipmentType === EquipmentType.Shield;

  if (
    mainHandEquipmentOption?.equipmentBaseItemProperties.equipmentType ===
    EquipmentType.TwoHandedRangedWeapon
  )
    mhIcons.push(SVG_ICONS[IconName.CrossedArrows]);

  if (mainHandEquipmentOption === undefined)
    mhIcons.push(KINETIC_TYPE_ICONS[KineticDamageType.Blunt]);
  else {
    const mhWeaponPropertiesOption = throwIfError(
      Equipment.getWeaponProperties(mainHandEquipmentOption)
    );
    mhWeaponPropertiesOption.damageClassification.forEach((classification, i) => {
      if (classification.elementOption !== undefined)
        mhIcons.push(MAGICAL_ELEMENT_ICONS[classification.elementOption]);
      if (classification.kineticDamageTypeOption !== undefined)
        mhIcons.push(KINETIC_TYPE_ICONS[classification.kineticDamageTypeOption]);

      if (i < mhWeaponPropertiesOption.damageClassification.length - 1) {
        // push a delimiter
        mhIcons.push(SVG_ICONS[IconName.VerticalLine]);
      }
    });
  }

  const mhIsTwoHanded =
    mainHandEquipmentOption &&
    Equipment.isTwoHanded(mainHandEquipmentOption.equipmentBaseItemProperties.equipmentType);

  const ohIcons = [];
  let ohDisabled = actionPoints < 2 && inCombat;
  if (!ohIsShield && !mhIsTwoHanded) {
    if (offHandEquipmentOption === undefined)
      ohIcons.push(KINETIC_TYPE_ICONS[KineticDamageType.Blunt]);
    else {
      const ohWeaponPropertiesOption = throwIfError(
        Equipment.getWeaponProperties(offHandEquipmentOption)
      );
      ohWeaponPropertiesOption.damageClassification.forEach((classification, i) => {
        if (classification.elementOption)
          ohIcons.push(MAGICAL_ELEMENT_ICONS[classification.elementOption]);
        if (classification.kineticDamageTypeOption)
          ohIcons.push(KINETIC_TYPE_ICONS[classification.kineticDamageTypeOption]);
        if (i < ohWeaponPropertiesOption.damageClassification.length - 1) {
          // push a delimiter
          ohIcons.push(SVG_ICONS[IconName.VerticalLine]);
        }
      });
    }
  }

  return { mhIcons, ohIcons, ohDisabled };
}

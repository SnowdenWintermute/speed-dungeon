import { IconName, KINETIC_TYPE_ICONS, MAGICAL_ELEMENT_ICONS, SVG_ICONS } from "@/app/icons";
import {
  CombatantProperties,
  EquipmentSlotId,
  EquipmentType,
  KineticDamageType,
} from "@speed-dungeon/common";

export function getAttackActionIcons(user: CombatantProperties, inCombat: boolean) {
  const mhIcons = [];

  const actionPoints = user.resources.getActionPoints();
  const mainHandEquipmentOption = user.equipment.hotswapSlotsManager.activeSlot.getEquipmentInSlot(
    EquipmentSlotId.MainHand
  );
  const offHandEquipmentOption = user.equipment.hotswapSlotsManager.activeSlot.getEquipmentInSlot(
    EquipmentSlotId.OffHand
  );
  const ohIsShield =
    offHandEquipmentOption?.equipmentBaseItemProperties.equipmentType === EquipmentType.Shield;

  if (
    mainHandEquipmentOption?.equipmentBaseItemProperties.equipmentType ===
    EquipmentType.TwoHandedRangedWeapon
  ) {
    mhIcons.push(SVG_ICONS[IconName.CrossedArrows]);
  }

  if (mainHandEquipmentOption === null) {
    mhIcons.push(KINETIC_TYPE_ICONS[KineticDamageType.Blunt]);
  } else {
    const mhWeaponPropertiesOption = mainHandEquipmentOption.requireWeaponProperties();
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

  const mhIsTwoHanded = mainHandEquipmentOption && mainHandEquipmentOption.isTwoHanded();

  const ohIcons = [];
  const ohDisabled = actionPoints < 2 && inCombat;
  if (!ohIsShield && !mhIsTwoHanded) {
    if (offHandEquipmentOption === null) {
      ohIcons.push(KINETIC_TYPE_ICONS[KineticDamageType.Blunt]);
    } else {
      const ohWeaponPropertiesOption = offHandEquipmentOption.requireWeaponProperties();
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

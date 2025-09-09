import { IconName, KINETIC_TYPE_ICONS, MAGICAL_ELEMENT_ICONS, SVG_ICONS } from "@/app/icons";
import {
  CombatActionName,
  CombatantEquipment,
  CombatantProperties,
  Equipment,
  EquipmentType,
  HoldableSlotType,
  KineticDamageType,
  throwIfError,
} from "@speed-dungeon/common";
import { ReactNode } from "react";

export const ACTION_ICONS: Record<CombatActionName, null | ((className: string) => ReactNode)> = {
  [CombatActionName.Attack]: null,
  [CombatActionName.AttackMeleeMainhand]: null,
  [CombatActionName.AttackMeleeOffhand]: null,
  [CombatActionName.AttackRangedMainhand]: null,
  [CombatActionName.AttackRangedMainhandProjectile]: null,
  [CombatActionName.CounterAttackRangedMainhandProjectile]: null,
  [CombatActionName.Counterattack]: null,
  [CombatActionName.CounterattackMeleeMainhand]: null,
  [CombatActionName.CounterattackRangedMainhand]: null,
  [CombatActionName.ChainingSplitArrowParent]: null,
  [CombatActionName.ChainingSplitArrowProjectile]: null,
  [CombatActionName.ExplodingArrowParent]: null,
  [CombatActionName.ExplodingArrowProjectile]: null,
  [CombatActionName.Explosion]: null,
  [CombatActionName.IceBoltParent]: (className: string) => SVG_ICONS[IconName.Ice](className),
  [CombatActionName.IceBoltProjectile]: null,
  [CombatActionName.IceBurst]: null,
  [CombatActionName.Fire]: (className: string) => SVG_ICONS[IconName.Fire](className),
  [CombatActionName.BurningTick]: null,
  [CombatActionName.Healing]: (className: string) => SVG_ICONS[IconName.HealthCross](className),
  [CombatActionName.UseGreenAutoinjector]: null,
  [CombatActionName.UseBlueAutoinjector]: null,
  [CombatActionName.PassTurn]: (className: string) => SVG_ICONS[IconName.Hourglass](className),
  [CombatActionName.ConditionPassTurn]: null,
  [CombatActionName.Blind]: (className: string) => SVG_ICONS[IconName.EyeClosed](className),
  [CombatActionName.PayActionPoint]: null,
  [CombatActionName.ReadSkillBook]: (className: string) => SVG_ICONS[IconName.Book](className),
  [CombatActionName.Firewall]: (className: string) => {
    return (
      <div className={className + " flex translate-x-2"}>
        <div className="h-full translate-x-1/3">{SVG_ICONS[IconName.Fire](className)}</div>
        <div className="h-full ">{SVG_ICONS[IconName.Fire](className)}</div>
        <div className="h-full -translate-x-1/3">{SVG_ICONS[IconName.Fire](className)}</div>
      </div>
    );
  },
  [CombatActionName.FirewallBurn]: null,
};

export function getAttackActionIcons(user: CombatantProperties, inCombat: boolean) {
  const mhIcons = [];

  const { actionPoints } = user;
  const mainHandEquipmentOption = CombatantEquipment.getEquippedHoldable(
    user,
    HoldableSlotType.MainHand
  );
  const offHandEquipmentOption = CombatantEquipment.getEquippedHoldable(
    user,
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

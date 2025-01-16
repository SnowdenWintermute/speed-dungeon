import React, { ReactNode } from "react";
import SwordIcon from "../../../../public/img/equipment-icons/sword.svg";
import ShieldIcon from "../../../../public/img/equipment-icons/shield.svg";
import BowIcon from "../../../../public/img/equipment-icons/bow.svg";
import BodyIcon from "../../../../public/img/equipment-icons/body.svg";
import HeadGearIcon from "../../../../public/img/equipment-icons/head-gear.svg";
import AmuletIcon from "../../../../public/img/equipment-icons/amulet.svg";
import RingIcon from "../../../../public/img/equipment-icons/ring-flattened.svg";
import { Equipment, EquipmentType } from "@speed-dungeon/common";
import { UNMET_REQUIREMENT_COLOR, WARNING_COLOR, WARNING_COLOR_DARK } from "@/client_consts";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";

const DURABILITY_WARNING_THRESHOLD_MODERATE = 0.3;
const DURABILITY_WARNING_THRESHOLD_CRITICAL = 0.1;

export default function LowDurabilityIndicators({
  isPlayerControlled,
  equippedItems,
}: {
  isPlayerControlled: boolean;
  equippedItems: Equipment[];
}) {
  let indicators = [];

  for (const equipment of equippedItems) {
    if (Equipment.isIndestructable(equipment) || equipment.durability === null) continue;
    const { durability } = equipment;
    const durabilityPercentage = durability.current / durability.max;
    if (durabilityPercentage === 0) continue;
    let iconColor;
    if (durabilityPercentage < DURABILITY_WARNING_THRESHOLD_CRITICAL || durability.current === 1) {
      iconColor = UNMET_REQUIREMENT_COLOR;
    } else if (durabilityPercentage < DURABILITY_WARNING_THRESHOLD_MODERATE) {
      iconColor = WARNING_COLOR_DARK;
    }

    if (iconColor) {
      indicators.push({
        durability: equipment.durability,
        icon: EQUIPMENT_ICONS[equipment.equipmentBaseItemProperties.equipmentType]("h-full", {
          fill: iconColor,
        }),
      });
    }
  }

  return (
    <ul className={`flex list-none h-full w-full justify-end`}>
      {indicators.map((indicator, i) => (
        <li key={i} className="mr-1 last:mr-0 h-full pointer-events-auto">
          <HoverableTooltipWrapper
            extraStyles="h-full"
            tooltipText={`${indicator.durability.current}/${indicator.durability.max} durability`}
          >
            {indicator.icon}
          </HoverableTooltipWrapper>
        </li>
      ))}
    </ul>
  );
}

export const EQUIPMENT_ICONS: Record<
  EquipmentType,
  (className: string, style: { [key: string]: string }) => ReactNode
> = {
  [EquipmentType.BodyArmor]: (className: string, style: { [key: string]: string }) => (
    <BodyIcon className={className} style={style} />
  ),
  [EquipmentType.HeadGear]: (className: string, style: { [key: string]: string }) => (
    <HeadGearIcon className={className} style={style} />
  ),
  [EquipmentType.Ring]: (className: string, style: { [key: string]: string }) => (
    <RingIcon className={className} style={style} />
  ),
  [EquipmentType.Amulet]: (className: string, style: { [key: string]: string }) => (
    <AmuletIcon className={className} style={style} />
  ),
  [EquipmentType.OneHandedMeleeWeapon]: (className: string, style: { [key: string]: string }) => (
    <SwordIcon className={className} style={style} />
  ),
  [EquipmentType.TwoHandedMeleeWeapon]: (className: string, style: { [key: string]: string }) => (
    <SwordIcon className={className} style={style} />
  ),
  [EquipmentType.TwoHandedRangedWeapon]: (className: string, style: { [key: string]: string }) => (
    <BowIcon className={className} style={style} />
  ),
  [EquipmentType.Shield]: (className: string, style: { [key: string]: string }) => (
    <ShieldIcon className={className} style={style} />
  ),
};

import React from "react";
import { Equipment } from "@speed-dungeon/common";
import { UNMET_REQUIREMENT_COLOR, WARNING_COLOR_DARK } from "@/client_consts";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { EQUIPMENT_ICONS } from "../detailables/EquipmentDetails/equipment-icons";

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
    const durability = Equipment.getModifiedDurability(equipment);
    if (Equipment.isIndestructable(equipment) || durability === null) continue;
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
        durability: durability,
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

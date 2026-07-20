import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { IconName, SVG_ICONS } from "@/app/icons";
import {
  CombatAttribute,
  CombatantAttributeRecord,
  CombatantProperties,
} from "@speed-dungeon/common";
import React from "react";

export default function HpAndMp({
  combatantProperties,
  totalAttributes,
}: {
  combatantProperties: CombatantProperties;
  totalAttributes: CombatantAttributeRecord;
}) {
  const maxHpOption = totalAttributes[CombatAttribute.Hp];
  const maxMpOption = totalAttributes[CombatAttribute.Mp];

  const mana = combatantProperties.resources.getMana();

  return (
    <div className="flex w-1/2 pr-2 justify-between">
      <div className="w-1/2 flex">
        <HoverableTooltipWrapper tooltipText="Hit Points">
          <div className="h-5 w-6  mr-1">{SVG_ICONS[IconName.Heart]("h-full fill-slate-400")}</div>
        </HoverableTooltipWrapper>
        <span>
          {maxHpOption !== undefined
            ? `${combatantProperties.resources.getHitPoints()}/${maxHpOption}`
            : "Immortal Object"}
        </span>
      </div>
      <div className="w-1/2 flex ml-1 justify-start ">
        <HoverableTooltipWrapper tooltipText="Mana">
          <div className="h-6 w-6 flex justify-center items-center pb-1 mr-1">
            {SVG_ICONS[IconName.Droplet]("h-full fill-slate-400")}
          </div>
        </HoverableTooltipWrapper>
        {maxMpOption !== undefined && !isNaN(mana) ? (
          <span>{`${mana}/${maxMpOption}`}</span>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { KINETIC_TYPE_ICONS } from "@/app/icons";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import {
  iterateNumericEnum,
  KINETIC_DAMAGE_TYPE_STRINGS,
  KineticDamageType,
} from "@speed-dungeon/common";
import React from "react";

export default function KineticAffinitiesDisplay({
  affinities,
}: {
  affinities: Partial<Record<KineticDamageType, number>>;
}) {
  return (
    <div className="">
      <ul className="flex my-1">
        {iterateNumericEnum(KineticDamageType).map((kineticType) => (
          <KineticAffinityDisplay
            key={kineticType}
            kineticType={kineticType}
            affinity={affinities[kineticType] || 0}
          />
        ))}
      </ul>
    </div>
  );
}

function KineticAffinityDisplay({
  kineticType,
  affinity,
}: {
  kineticType: KineticDamageType;
  affinity: number;
}) {
  let numberStyles = "";
  let textShadowStyle = {};
  if (affinity < 0) numberStyles = UNMET_REQUIREMENT_TEXT_COLOR;
  if (affinity > 100) {
    numberStyles = "text-green-600 shadow-black";
    textShadowStyle = { textShadow: "2px 2px 0px #000000" };
  }
  return (
    <li className="flex items-center w-24 ">
      <HoverableTooltipWrapper
        extraStyles="h-fit"
        tooltipText={`${KINETIC_DAMAGE_TYPE_STRINGS[kineticType]} affinity. Negative numbers indicate weakness, positive numbers indicate resistance, and numbers above 100% indicate absorbtion.`}
      >
        <div className="h-5 mr-1">
          {KINETIC_TYPE_ICONS[kineticType]("h-full w-10 stroke-slate-400 fill-slate-400")}
        </div>
      </HoverableTooltipWrapper>
      <div className={"w-10 " + numberStyles} style={textShadowStyle}>
        {affinity}%
      </div>
    </li>
  );
}

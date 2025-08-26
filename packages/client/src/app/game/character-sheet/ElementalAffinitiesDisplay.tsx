import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { MAGICAL_ELEMENT_ICONS } from "@/app/icons";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import { iterateNumericEnum, MAGICAL_ELEMENT_STRINGS, MagicalElement } from "@speed-dungeon/common";
import React from "react";

export default function ElementalAffinitiesDisplay({
  affinities,
}: {
  affinities: Partial<Record<MagicalElement, number>>;
}) {
  const top = [];
  const bottom = [];

  let index = -1;
  for (const element of iterateNumericEnum(MagicalElement)) {
    index += 1;
    const isEven = index % 2 === 0;
    if (isEven) top.push(element);
    else bottom.push(element);
  }

  return (
    <div className="flex flex-col ">
      <ul className="flex my-1">
        {top.map((element) => (
          <ElementAffinityDisplay
            key={element}
            element={element}
            affinity={affinities[element] || 0}
          />
        ))}
      </ul>
      <ul className="flex ">
        {bottom.map((element) => (
          <ElementAffinityDisplay
            key={element}
            element={element}
            affinity={affinities[element] || 0}
          />
        ))}
      </ul>
    </div>
  );
}

function ElementAffinityDisplay({
  element,
  affinity,
}: {
  element: MagicalElement;
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
    <li className="flex items-center w-24">
      <HoverableTooltipWrapper
        extraStyles="h-fit"
        tooltipText={`${MAGICAL_ELEMENT_STRINGS[element]} affinity. Negative numbers indicate weakness, positive numbers indicate resistance, and numbers above 100% indicate absorbtion.`}
      >
        <div className="h-5 mr-1">
          {MAGICAL_ELEMENT_ICONS[element]("h-full w-10 stroke-slate-400 fill-slate-400")}
        </div>
      </HoverableTooltipWrapper>
      <div className={"w-10 " + numberStyles} style={textShadowStyle}>
        {affinity}%
      </div>
    </li>
  );
}

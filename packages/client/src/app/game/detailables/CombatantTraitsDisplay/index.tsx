import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import {
  COMBATANT_TRAIT_DESCRIPTIONS,
  CombatantTraitProperties,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import React from "react";

export default function CombatantTraitsDisplay({
  traitProperties,
}: {
  traitProperties: CombatantTraitProperties;
}) {
  return iterateNumericEnumKeyedRecord(traitProperties.inherentTraitLevels).map(
    ([traitType, level], i) => {
      const description = COMBATANT_TRAIT_DESCRIPTIONS[traitType];
      return (
        <li key={i}>
          <span className="inline-block h-6 w-6">
            <HoverableTooltipWrapper tooltipText={description.summary}>
              <span className="cursor-help h-full w-full inline-block">{"ⓘ "}</span>
            </HoverableTooltipWrapper>
          </span>
          <span>
            {description.name} R{level}
          </span>
        </li>
      );
    }
  );
}

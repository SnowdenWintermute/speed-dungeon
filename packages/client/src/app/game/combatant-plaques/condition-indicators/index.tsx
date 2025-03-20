import {
  COMBATANT_CONDITION_DESCRIPTIONS,
  COMBATANT_CONDITION_NAME_STRINGS,
  CombatantCondition,
} from "@speed-dungeon/common";
import React from "react";
import { CONDITION_INDICATOR_ICONS } from "./condition-indicator-icons";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";

interface Props {
  conditions: CombatantCondition[];
}

export default function ConditionIndicators(props: Props) {
  const { conditions } = props;
  return (
    <ul className="flex">
      {conditions.map((condition, i) => (
        <li
          key={i}
          className="h-6 mr-1 border border-slate-400 bg-slate-700 pointer-events-auto cursor-help"
        >
          <HoverableTooltipWrapper
            extraStyles="h-full w-full p-0.5"
            tooltipText={`${COMBATANT_CONDITION_NAME_STRINGS[condition.name]}: ${COMBATANT_CONDITION_DESCRIPTIONS[condition.name]}`}
          >
            {CONDITION_INDICATOR_ICONS[condition.name]}
          </HoverableTooltipWrapper>
        </li>
      ))}
    </ul>
  );
}

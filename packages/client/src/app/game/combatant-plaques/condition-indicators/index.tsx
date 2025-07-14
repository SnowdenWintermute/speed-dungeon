import {
  COMBATANT_CONDITION_DESCRIPTIONS,
  COMBATANT_CONDITION_NAME_STRINGS,
  CombatantCondition,
} from "@speed-dungeon/common";
import React from "react";
import { CONDITION_INDICATOR_ICONS } from "./condition-indicator-icons";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { useUIStore } from "@/stores/ui-store";

interface Props {
  conditions: CombatantCondition[];
}

export default function ConditionIndicators(props: Props) {
  const { conditions } = props;
  const isDebug = useUIStore.getState().showDebug;
  return (
    <ul className="flex">
      {conditions.map((condition, i) => {
        const hoverableDebugText = isDebug ? ` ${condition.id}` : "";

        return (
          <li
            key={i}
            className="h-6 mr-1 border border-slate-400 bg-slate-700 pointer-events-auto cursor-help relative"
          >
            <HoverableTooltipWrapper
              extraStyles="h-full w-full p-0.5"
              tooltipText={`${COMBATANT_CONDITION_NAME_STRINGS[condition.name]}: ${COMBATANT_CONDITION_DESCRIPTIONS[condition.name]} (rank ${condition.level})${hoverableDebugText}`}
            >
              {CONDITION_INDICATOR_ICONS[condition.name]}{" "}
            </HoverableTooltipWrapper>
            {condition.stacksOption && condition.stacksOption.current > 1 && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                {condition.stacksOption.current}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

import {
  COMBATANT_CONDITION_DESCRIPTIONS,
  COMBATANT_CONDITION_NAME_STRINGS,
  CombatantCondition,
} from "@speed-dungeon/common";
import React from "react";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { CONDITION_INDICATOR_ICONS } from "@/app/icons";
import { AppStore } from "@/mobx-stores/app-store";
import { DialogElementName } from "@/mobx-stores/dialogs";
import { observer } from "mobx-react-lite";

interface Props {
  conditions: CombatantCondition[];
}

export default function ConditionIndicators(props: Props) {
  const { conditions } = props;
  return (
    <ul className="flex">
      {conditions.map((condition, i) => {
        return (
          <li key={COMBATANT_CONDITION_NAME_STRINGS[condition.name] + i}>
            <ConditionIndicator condition={condition} />
          </li>
        );
      })}
    </ul>
  );
}

export const ConditionIndicator = observer(({ condition }: { condition: CombatantCondition }) => {
  const showDebug = AppStore.get().dialogStore.isOpen(DialogElementName.Debug);

  const hoverableDebugText = showDebug
    ? `\nid: ${condition.id} \nappliedBy: ${condition.appliedBy.entityProperties.id}`
    : "";
  return (
    <div className="h-6 mr-1 border border-slate-400 bg-slate-700 pointer-events-auto cursor-help relative">
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
    </div>
  );
});

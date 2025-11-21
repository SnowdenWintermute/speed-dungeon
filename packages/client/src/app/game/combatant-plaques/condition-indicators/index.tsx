import {
  COMBATANT_CONDITION_DESCRIPTIONS,
  COMBATANT_CONDITION_NAME_STRINGS,
  CombatantCondition,
  CombatantConditionName,
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

export const ConditionIndicators = observer((props: Props) => {
  const { conditions } = props;

  return (
    <ul className="flex">
      {
        conditions.map((condition, i) => {
          return (
            <li key={COMBATANT_CONDITION_NAME_STRINGS[condition.name] + i}>
              <ConditionIndicator condition={condition} />
            </li>
          );
        })
        // .concat(
        //   new Array(9)
        //     .fill(<DummyConditionIndicatorForUiTesting />)
        //     .map((element, i) => <li key={i}>{element}</li>)
        // )
      }
    </ul>
  );
});

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

export const DummyConditionIndicatorForUiTesting = observer(() => {
  const showDebug = AppStore.get().dialogStore.isOpen(DialogElementName.Debug);

  const hoverableDebugText = showDebug ? `\nid: doesn't exist - debug \nappliedBy: nothing` : "";

  return (
    <div className="h-6 mr-1 border border-slate-400 bg-slate-700 pointer-events-auto cursor-help relative">
      <HoverableTooltipWrapper
        extraStyles="h-full w-full p-0.5"
        tooltipText={`fake condition: does nothing (rank 0)${hoverableDebugText}`}
      >
        {CONDITION_INDICATOR_ICONS[CombatantConditionName.PrimedForIceBurst]}{" "}
      </HoverableTooltipWrapper>
      {
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          {99}
        </div>
      }
    </div>
  );
});

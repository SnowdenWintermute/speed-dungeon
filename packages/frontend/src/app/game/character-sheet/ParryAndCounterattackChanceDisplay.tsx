import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { IconName, SVG_ICONS } from "@/app/icons";
import { CombatantProperties } from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import React from "react";

interface Props {
  combatantProperties: CombatantProperties;
}

export const ParryAndCounterattackChanceDisplay = observer((props: Props) => {
  const { combatantProperties } = props;
  const { mitigationProperties } = combatantProperties;
  const parryChance = mitigationProperties.getParryChance();
  const counterattackChance = mitigationProperties.getCounterattackChance();

  return (
    <div className="flex w-1/2 justify-between">
      {parryChance ? (
        <div className="flex w-1/2">
          <HoverableTooltipWrapper tooltipText="Parry chance">
            <div className="h-6 w-6 mr-1">{SVG_ICONS[IconName.Parry]("h-6 fill-slate-400")}</div>
          </HoverableTooltipWrapper>
          <div>{Math.floor(parryChance * 100)}%</div>
        </div>
      ) : (
        ""
      )}
      {counterattackChance ? (
        <div className="flex w-1/2">
          <HoverableTooltipWrapper tooltipText="Counterattack chance">
            <div className="w-6 h-6 mr-1">
              {SVG_ICONS[IconName.Counterattack]("h-6 fill-slate-400")}
            </div>
          </HoverableTooltipWrapper>
          <div>{Math.floor(counterattackChance * 100)}%</div>
        </div>
      ) : (
        ""
      )}
    </div>
  );
});

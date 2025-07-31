import {
  formatThousandsAsK,
  getNextOrPreviousNumber,
  iterateNumericEnum,
  NextOrPrevious,
  ThreatManager,
  ThreatTableEntry,
  ThreatType,
} from "@speed-dungeon/common";
import React from "react";

import { useGameStore } from "@/stores/game-store";
import {
  getCombatantClassIcon,
  getCombatantUiIdentifierIcon,
} from "@/utils/get-combatant-class-icon";
import { UI_DISPLAY_MODE_STRINGS, UiDisplayMode, useUIStore } from "@/stores/ui-store";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";

interface Props {
  threatManager: null | ThreatManager;
}

export default function ThreatPriorityList({ threatManager }: Props) {
  if (threatManager === null) return <></>;

  const entries = threatManager.getEntries();

  const threatTableDetailedDisplayMode = useUIStore().threatTableDetailedDisplayMode;
  // const widthClass = threatTableDetailedDisplayMode ? "w-40" : "w-24";
  //${widthClass}
  const topThreatId = threatManager.getHighestThreatCombatantId();
  const highestThreat =
    topThreatId !== null ? threatManager.getEntries()[topThreatId]?.getTotal() : 0;

  return (
    <div className={`min-h-full pointer-events-auto pr-1`}>
      <ul>
        {Object.entries(entries)
          .sort((a, b) => b[1].getTotal() - a[1].getTotal())
          .map(([entityId, threatTableEntry], i) => (
            <li key={entityId} className="mb-1 last:mb-0">
              <ThreatTrackerIcon
                extraStyles={""}
                entityId={entityId}
                threatTableEntry={threatTableEntry}
                percentOfTopThreat={threatTableEntry.getTotal() / (highestThreat || 1)}
              />
            </li>
          ))}
      </ul>
    </div>
  );
}

function ThreatTrackerIcon(props: {
  extraStyles: string;
  entityId: string;
  threatTableEntry: ThreatTableEntry;
  percentOfTopThreat: number;
}) {
  const threatTableDetailedDisplayMode = useUIStore().threatTableDetailedDisplayMode;
  const debugMode = useUIStore().showDebug;
  const mutateUIStore = useUIStore().mutateState;

  const { extraStyles, entityId, threatTableEntry } = props;

  const combatantResult = useGameStore().getCombatant(entityId);
  if (combatantResult instanceof Error) return <div>no combatant found</div>;
  const classIcon = getCombatantClassIcon(
    combatantResult.combatantProperties.combatantClass,
    "fill-slate-400",
    "stroke-slate-400"
  );

  const stableThreat = threatTableEntry.threatScoresByType[ThreatType.Stable].current;
  // const stableThreat = 1039;
  const volatileThreat = threatTableEntry.threatScoresByType[ThreatType.Volatile].current;
  // const volatileThreat = 9382;

  const totalThreat = stableThreat + volatileThreat;

  function handleClick() {
    mutateUIStore((state) => {
      state.threatTableDetailedDisplayMode = getNextOrPreviousNumber(
        state.threatTableDetailedDisplayMode,
        iterateNumericEnum(UiDisplayMode).length - 1,
        NextOrPrevious.Next,
        { minNumber: 0 }
      );
    });
  }

  const hoverableDebugText = debugMode ? entityId : "";

  const detailedThreat = (
    <div className="flex h-full items-center justify-between ">
      <div className="text-zinc-300 w-1/2 flex justify-center" style={{ minWidth: "5ch" }}>
        <HoverableTooltipWrapper tooltipText={`Stable Threat ${hoverableDebugText}`}>
          <span>{formatThousandsAsK(stableThreat)}</span>
        </HoverableTooltipWrapper>
      </div>
      <span>|</span>

      <div className="text-slate-400 w-1/2 flex justify-center" style={{ minWidth: "5ch" }}>
        <HoverableTooltipWrapper tooltipText={`Volatile Threat ${hoverableDebugText}`}>
          <span>{formatThousandsAsK(volatileThreat)}</span>
        </HoverableTooltipWrapper>
      </div>
    </div>
  );

  const simpleThreat = (
    <div
      className="text-slate-400 w-fit h-full flex justify-center items-center"
      style={{ minWidth: "5ch" }}
    >
      <HoverableTooltipWrapper tooltipText={`Total Threat ${hoverableDebugText}`}>
        <span>{formatThousandsAsK(totalThreat)}</span>
      </HoverableTooltipWrapper>
    </div>
  );

  const party = useGameStore().getParty();
  if (party instanceof Error) return <div>no party</div>;
  const combatantUiIdentifierIcon = getCombatantUiIdentifierIcon(party, combatantResult);

  return (
    <button className={`${extraStyles} w-full h-8`} onClick={handleClick}>
      <div className="h-full w-full flex items-center justify-center relative">
        <div className="bg-slate-700 border border-slate-400 h-8 w-8 rounded-full z-20 absolute right-0 overflow-hidden">
          <HoverableTooltipWrapper
            tooltipText={`Toggle Mode: ${UI_DISPLAY_MODE_STRINGS[threatTableDetailedDisplayMode]}`}
            extraStyles="h-full w-full absolute z-10"
          >
            <div></div>
          </HoverableTooltipWrapper>
          <div
            className={
              "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[50%] flex justify-center items-center"
            }
            style={{ height: "90%", width: "90%" }}
          >
            <div className="h-full">
              {debugMode ? entityId.slice(0, 2) : combatantUiIdentifierIcon}
            </div>
          </div>
        </div>
        <div className=" bg-slate-700 border border-r-0 border-slate-400 w-fit h-full mr-4 pl-2 pr-5">
          {threatTableDetailedDisplayMode === UiDisplayMode.Detailed ? (
            detailedThreat
          ) : threatTableDetailedDisplayMode === UiDisplayMode.Simple ? (
            simpleThreat
          ) : (
            <div
              className="bg-slate-500 w-1/2 absolute bottom-0 left-0"
              style={{
                height: `${props.percentOfTopThreat * 100}%`,
              }}
            />
          )}
        </div>
      </div>
    </button>
  );
}

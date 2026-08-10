import { useState } from "react";
import { DataTable } from "@speed-dungeon/ui/atoms/DataTable";
import { DataTableLayout } from "@speed-dungeon/ui/atoms/DataTable/column";
import Divider from "@speed-dungeon/ui/atoms/Divider";
import { DungeonRunAnalysis, DUNGEON_RUN_ANALYSIS_NAMES } from "@/analysis/dungeon-run-analysis";
import { PartyDrawMode, PartyDrawSettings } from "@/analysis/available-damage/party-draw";
import {
  comboKey,
  comboName,
  SPECIALTY_COMBOS,
  SpecialtyCombo,
} from "@/analysis/available-damage/specialty-combo";
import { useDungeonRunAnalysis } from "@/hooks/use-dungeon-run-analysis";
import { AnalysisRunControls } from "../AnalysisRunControls";
import { AVAILABLE_DAMAGE_COLUMNS, comboRowsOf, roomKey } from "./available-damage-columns";
import { ComboSelectors } from "./ComboSelectors";
import { DrawModeToggle } from "./DrawModeToggle";

const DEFAULT_RUN_COUNT = 50;

function firstCombo(): SpecialtyCombo {
  const combo = SPECIALTY_COMBOS[0];
  if (combo === undefined) {
    throw new Error("no specialty combos exist to measure");
  }
  return combo;
}

export function AvailableDamagePanel() {
  const { state, run } = useDungeonRunAnalysis(DungeonRunAnalysis.AvailableDamage);
  const [drawMode, setDrawMode] = useState(PartyDrawMode.EvenlyDistributed);
  const [combo, setCombo] = useState(firstCombo);

  const draw: PartyDrawSettings =
    drawMode === PartyDrawMode.EvenlyDistributed
      ? { type: PartyDrawMode.EvenlyDistributed }
      : { type: PartyDrawMode.GuaranteeCombo, combo };

  return (
    <section>
      <h2 className="text-xl mb-1">
        {DUNGEON_RUN_ANALYSIS_NAMES[DungeonRunAnalysis.AvailableDamage]}
      </h2>
      <p className="text-sm text-theme-muted mb-4 max-w-3xl">
        Damage per turn one specialty could reach against a middle-intensity monster, room by room,
        out of everything the party has found. The selects choose which combo the table shows, and
        before a walk they also choose which combo the runs guarantee.
      </p>

      <div className="mb-4">
        <DrawModeToggle mode={drawMode} onChange={setDrawMode} disabled={state.isRunning} />
      </div>

      <div className="mb-4">
        <ComboSelectors combo={combo} onChange={setCombo} disabled={state.isRunning} />
      </div>

      <div className="mb-4">
        <AnalysisRunControls
          defaultRunCount={DEFAULT_RUN_COUNT}
          isRunning={state.isRunning}
          runsCompleted={state.runsCompleted}
          runsRequested={state.runsRequested}
          onRun={(runCount) => run(runCount, { draw })}
        />
      </div>

      {state.failureReason !== null && (
        <p className="text-theme-danger mb-4">{state.failureReason}</p>
      )}

      {state.completed === null ? (
        <p className="text-theme-muted">Nothing walked yet.</p>
      ) : (
        <div className="w-full">
          <p className="text-sm text-theme-muted mb-2">
            {`${state.completed.runCount} runs — ${comboName(combo)}`}
          </p>
          <Divider extraStyles="mb-8" />
          {/* the scroller is the table's own wrapper rather than the section, so the headings and
              controls stay put while the columns move */}
          <div className="bg-theme-base border p-2 px-4 border-theme-muted mb-10 w-full overflow-x-auto">
            <DataTable
              columns={AVAILABLE_DAMAGE_COLUMNS}
              entries={comboRowsOf(state.completed.result, comboKey(combo))}
              keyOf={roomKey}
              emptyMessage="no rooms walked"
              layoutOption={DataTableLayout.FitContent}
            />
          </div>
        </div>
      )}
    </section>
  );
}

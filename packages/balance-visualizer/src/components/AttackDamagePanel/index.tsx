import { useMemo, useState } from "react";
import { DataTable } from "@speed-dungeon/ui/atoms/DataTable";
import { DataTableLayout } from "@speed-dungeon/ui/atoms/DataTable/column";
import { DEFAULT_ANALYSIS_CHARACTER_SPECS } from "@/analysis-runs/attack-damage";
import { useAttackDamageRunSet } from "@/hooks/use-attack-damage-run-set";
import { ATTACK_DAMAGE_TABLE_COLUMNS } from "@/tables/attack-damage/columns";
import { AttackDamageSlice, roomKey } from "@/tables/attack-damage/row";
import { AnalysisRunControls } from "../AnalysisRunControls";
import { AttackDamageSliceControls } from "./AttackDamageSliceControls";

const DEFAULT_RUN_COUNT = 10;

export function AttackDamagePanel() {
  const { state, run } = useAttackDamageRunSet();
  const [slice, setSlice] = useState<AttackDamageSlice>({});

  // re-aggregating every sample is the expensive half of showing this table, and a keystroke in
  // the run count input would otherwise pay for it
  const rows = useMemo(
    () => (state.table === null ? [] : state.table.selectRows(slice)),
    [state.table, slice]
  );

  return (
    <div>
      <div className="mb-4">
        <AnalysisRunControls
          defaultRunCount={DEFAULT_RUN_COUNT}
          isRunning={state.isRunning}
          runsFinished={state.runsFinished}
          runsRequested={state.runsRequested}
          onRun={(runCount) => run(DEFAULT_ANALYSIS_CHARACTER_SPECS, runCount)}
        />
      </div>

      {state.failureReason !== null && (
        <p className="mb-4 text-theme-danger">run set failed: {state.failureReason}</p>
      )}

      {state.runsFailed > 0 && (
        <p className="mb-4 text-theme-muted">
          {state.runsFailed} of {state.runCountShown} runs threw and were left out
        </p>
      )}

      <AttackDamageSliceControls slice={slice} onChange={setSlice} />

      <DataTable
        columns={ATTACK_DAMAGE_TABLE_COLUMNS}
        entries={rows}
        keyOf={roomKey}
        emptyMessage={state.table === null ? "no runs yet" : "no samples match this slice"}
        layoutOption={DataTableLayout.FitContent}
      />
    </div>
  );
}

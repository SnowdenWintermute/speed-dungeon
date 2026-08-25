import { useMemo, useState } from "react";
import { DataTable } from "@speed-dungeon/ui/atoms/DataTable";
import { DataTableLayout } from "@speed-dungeon/ui/atoms/DataTable/column";
import { AnalysisSlice, roomKey } from "@/analysis-runs/analysis-sample";
import { DungeonRunAnalysis } from "@/analysis-runs/dungeon-run-analysis";
import { DEFAULT_ANALYSIS_CHARACTER_SPECS } from "@/analysis-subjects/default-analysis-character-specs";
import { AnalysisRunControls } from "@/components/AnalysisRunControls";
import { AnalysisSliceControls } from "@/components/AnalysisSliceControls";
import { useAnalysisRunSet } from "@/hooks/use-analysis-run-set";
import { MAX_ACCURACY_TABLE_COLUMNS } from "./columns";
import { MaxAccuracyTable } from "./table";

const DEFAULT_RUN_COUNT = 100;

export function MaxAccuracyPanel() {
  const { state, run } = useAnalysisRunSet(DungeonRunAnalysis.MaxAccuracy);
  const [slice, setSlice] = useState<AnalysisSlice>({});

  const table = useMemo(
    () => (state.result === null ? null : new MaxAccuracyTable(state.result)),
    [state.result]
  );

  // re-aggregating every sample is the expensive half of showing this table, and a keystroke in
  // the run count input would otherwise pay for it
  const rows = useMemo(() => (table === null ? [] : table.selectRows(slice)), [table, slice]);

  return (
    <div className="">
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

      <AnalysisSliceControls slice={slice} onChange={setSlice} />

      <div className="bg-theme-base p-2 border border-theme-muted overflow-auto">
        <DataTable
          columns={MAX_ACCURACY_TABLE_COLUMNS}
          entries={rows}
          keyOf={roomKey}
          emptyMessage={table === null ? "no runs yet" : "no samples match this slice"}
          layoutOption={DataTableLayout.FitContent}
        />
      </div>
    </div>
  );
}

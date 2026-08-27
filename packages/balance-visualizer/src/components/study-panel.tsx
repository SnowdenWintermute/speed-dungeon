import { ReactNode, useMemo, useState } from "react";
import { DataTable } from "@speed-dungeon/ui/atoms/DataTable";
import { DataTableColumn, DataTableLayout } from "@speed-dungeon/ui/atoms/DataTable/column";
import { AnalysisSlice, roomKey } from "@/analysis-runs/analysis-sample";
import { AnalysisTableRow } from "@/analysis-runs/analysis-sample-table";
import { DEFAULT_ANALYSIS_CHARACTER_SPECS } from "@/analysis-subjects/default-analysis-character-specs";
import { useAnalysisRunSet } from "@/hooks/use-analysis-run-set";
import { DungeonRunAnalysis, DungeonRunAnalysisResults } from "@/analysis-runs/types";
import { AnalysisRunControls } from "./analysis-run-controls";
import { AnalysisSliceControls } from "./analysis-slice-controls";

const DEFAULT_RUN_COUNT = 500;

interface StudyTable<TRow> {
  selectRows(slice: AnalysisSlice): TRow[];
}

interface Props<
  AnalysisType extends DungeonRunAnalysis,
  TRow extends AnalysisTableRow,
  TTable extends StudyTable<TRow>,
> {
  analysis: AnalysisType;
  columns: DataTableColumn<TRow>[];
  /** the class itself, so the memo below is not rebuilt by a new closure on every render */
  tableConstructor: new (result: DungeonRunAnalysisResults[AnalysisType]) => TTable;
  /** whatever the study does with a finished table, such as generating a module from it */
  renderTableActions?: (table: TTable) => ReactNode;
}

export function StudyPanel<
  AnalysisType extends DungeonRunAnalysis,
  TRow extends AnalysisTableRow,
  TTable extends StudyTable<TRow>,
>({
  analysis,
  columns,
  tableConstructor: TableConstructor,
  renderTableActions,
}: Props<AnalysisType, TRow, TTable>) {
  const { state, run } = useAnalysisRunSet(analysis);
  const [slice, setSlice] = useState<AnalysisSlice>({});

  const table = useMemo(
    () => (state.result === null ? null : new TableConstructor(state.result)),
    [state.result, TableConstructor]
  );

  const rows = useMemo(() => (table === null ? [] : table.selectRows(slice)), [table, slice]);

  return (
    <div className="">
      <div className="mb-4">
        <AnalysisRunControls
          defaultRunCount={DEFAULT_RUN_COUNT}
          isRunning={state.isRunning}
          runsFinished={state.runsFinished}
          runsRequested={state.runsRequested}
          onRun={(runCount, allocationIntensity) =>
            run(DEFAULT_ANALYSIS_CHARACTER_SPECS, runCount, allocationIntensity)
          }
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

      {table !== null && renderTableActions !== undefined && (
        <div className="mb-4">{renderTableActions(table)}</div>
      )}

      <div className="bg-theme-base p-2 border border-theme-muted overflow-auto">
        <DataTable
          columns={columns}
          entries={rows}
          keyOf={roomKey}
          emptyMessage={table === null ? "no runs yet" : "no samples match this slice"}
          layoutOption={DataTableLayout.FitContent}
        />
      </div>
    </div>
  );
}

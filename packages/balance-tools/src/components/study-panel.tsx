import { ReactNode, useMemo, useState } from "react";
import { DataTable } from "@speed-dungeon/ui/atoms/DataTable";
import { DataTableColumn, DataTableLayout } from "@speed-dungeon/ui/atoms/DataTable/column";
import { NormalizedPercentage, invariant } from "@speed-dungeon/common";
import { roomKey } from "@/analysis-runs/analysis-sample";
import { AnalysisSlice } from "@/analysis-runs/analysis-slice";
import { AnalysisTableRow } from "@/analysis-runs/analysis-sample-table";
import { useAnalysisRunSet } from "@/hooks/use-analysis-run-set";
import { DungeonRunAnalysis } from "@/analysis-runs/dungeon-run-analysis";
import { DungeonRunAnalysisResults } from "@/analysis-runs/types";
import { STUDY_CONFIGURATIONS } from "@/studies/study-configurations";
import { STUDY_ANALYSES, STUDY_NAME_SLUGS, StudyName } from "@/studies/study-name";
import { AnalysisRunControls } from "./analysis-run-controls";
import { AnalysisSliceControls } from "./analysis-slice-controls";
import { WriteFileButton } from "./write-file-button";

const DEFAULT_RUN_COUNT = 500;

interface StudyTable<TRow> {
  selectRows(slice: AnalysisSlice): TRow[];
}

interface Props<
  AnalysisType extends DungeonRunAnalysis,
  TRow extends AnalysisTableRow,
  TTable extends StudyTable<TRow>,
> {
  studyName: StudyName;
  /** the panel names this so it can parameterize the types the run set and table are read at */
  analysis: AnalysisType;
  columns: DataTableColumn<TRow>[];
  /** the class itself, so the memo below is not rebuilt by a new closure on every render */
  tableConstructor: new (result: DungeonRunAnalysisResults[AnalysisType]) => TTable;
  /** set by a study whose derivation only means anything at one intensity */
  fixedAllocationIntensity?: NormalizedPercentage;
  defaultAllocationIntensity?: NormalizedPercentage;
  /** whatever the study does with a finished table, such as generating a module from it */
  renderTableActions?: (table: TTable) => ReactNode;
}

export function StudyPanel<
  AnalysisType extends DungeonRunAnalysis,
  TRow extends AnalysisTableRow,
  TTable extends StudyTable<TRow>,
>({
  studyName,
  analysis,
  columns,
  tableConstructor: TableConstructor,
  fixedAllocationIntensity,
  defaultAllocationIntensity,
  renderTableActions,
}: Props<AnalysisType, TRow, TTable>) {
  const configuration = STUDY_CONFIGURATIONS[studyName];
  invariant(
    STUDY_ANALYSES[studyName] === analysis,
    `study ${STUDY_NAME_SLUGS[studyName]} is configured for a different analysis than the panel rendering it`
  );

  const { state, run, save } = useAnalysisRunSet(studyName, analysis);
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
          fixedAllocationIntensity={fixedAllocationIntensity}
          defaultAllocationIntensity={defaultAllocationIntensity}
          onRun={(options) => run(configuration.characterSpecs, options)}
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

      {state.resultIsFromSavedRun && (
        <p className="mb-4 text-theme-muted">
          Showing the saved run for {STUDY_NAME_SLUGS[studyName]} ({state.runCountShown} runs). Run
          a set to replace it.
        </p>
      )}

      <AnalysisSliceControls slice={slice} onChange={setSlice} />

      <div className="mb-4 flex items-center gap-4">
        <WriteFileButton label="save run" disabled={state.result === null} write={save} />
        {table !== null && renderTableActions !== undefined && renderTableActions(table)}
      </div>

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

import { ReactNode, useEffect, useMemo, useState } from "react";
import { DataTable } from "@speed-dungeon/ui/atoms/DataTable";
import { DataTableColumn, DataTableLayout } from "@speed-dungeon/ui/atoms/DataTable/column";
import LoadingSpinner from "@speed-dungeon/ui/atoms/LoadingSpinner";
import { NormalizedPercentage } from "@speed-dungeon/common";
import { roomKey } from "../analysis-runs/analysis-sample.ts";
import { AnalysisSlice } from "../analysis-runs/analysis-slice.ts";
import { AnalysisTableRow } from "../analysis-runs/analysis-sample-table.ts";
import { useAnalysisRunSet } from "../hooks/use-analysis-run-set.ts";
import {
  CopiedAttributeProfilesType,
  describeCopiedAttributeProfilesBlock,
  useCopiedAttributeProfiles,
} from "../hooks/use-copied-attribute-profiles.ts";
import { DungeonRunAnalysisResults } from "../analysis-runs/dungeon-run-analysis.ts";
import { STUDY_CONFIGURATIONS } from "../studies/study-configurations.ts";
import {
  AnalysisOfStudy,
  STUDY_ANALYSES,
  STUDY_NAME_SLUGS,
  StudyName,
} from "../studies/study-name.ts";
import { AnalysisRunControls } from "./analysis-run-controls.tsx";
import { AnalysisSliceControls } from "./analysis-slice-controls.tsx";
import { WriteFileButton } from "./write-file-button.tsx";

const DEFAULT_RUN_COUNT = 500;

interface StudyTable<TRow> {
  selectRows(slice: AnalysisSlice): TRow[];
}

interface Props<
  TStudy extends StudyName,
  TRow extends AnalysisTableRow,
  TTable extends StudyTable<TRow>,
> {
  studyName: TStudy;
  columns: DataTableColumn<TRow>[];
  /** the class itself, so the memo below is not rebuilt by a new closure on every render */
  tableConstructor: new (result: DungeonRunAnalysisResults[AnalysisOfStudy<TStudy>]) => TTable;
  /** set by a study whose derivation only means anything at one intensity */
  fixedAllocationIntensity?: NormalizedPercentage;
  defaultAllocationIntensity?: NormalizedPercentage;
  /** set by a study that is only itself with requirements handled one way */
  fixedHonorsEquipmentRequirements?: boolean;
  /** whatever the study does with a finished table, such as generating a module from it */
  renderTableActions?: (table: TTable) => ReactNode;
}

export function StudyPanel<
  TStudy extends StudyName,
  TRow extends AnalysisTableRow,
  TTable extends StudyTable<TRow>,
>({
  studyName,
  columns,
  tableConstructor: TableConstructor,
  fixedAllocationIntensity,
  defaultAllocationIntensity,
  fixedHonorsEquipmentRequirements,
  renderTableActions,
}: Props<TStudy, TRow, TTable>) {
  const configuration = STUDY_CONFIGURATIONS[studyName];
  const { state, run, save } = useAnalysisRunSet(studyName, STUDY_ANALYSES[studyName]);
  const [slice, setSlice] = useState<AnalysisSlice>({});

  const copiedProfiles = useCopiedAttributeProfiles(configuration.characterSpecs);

  const [table, setTable] = useState<null | TTable>(null);

  // building a table off 100MB of samples blocks, so it is queued behind the render that puts the
  // spinner up rather than done while rendering, where it would freeze an empty table into view
  const { result } = state;
  useEffect(() => {
    setTable(null);
    if (result === null) {
      return;
    }

    let isCurrent = true;
    const timeout = setTimeout(() => {
      if (isCurrent) {
        setTable(new TableConstructor(result));
      }
    }, 0);

    return () => {
      isCurrent = false;
      clearTimeout(timeout);
    };
  }, [result, TableConstructor]);

  const rows = useMemo(() => (table === null ? [] : table.selectRows(slice)), [table, slice]);

  const isPreparingTable = state.isLoadingSavedRun || (result !== null && table === null);

  const goalsInParty = useMemo(
    () => [...new Set(configuration.characterSpecs.map((spec) => spec.goal))],
    [configuration]
  );

  return (
    <div>
      <div className="mb-4">
        <AnalysisRunControls
          defaultRunCount={DEFAULT_RUN_COUNT}
          isRunning={state.isRunning}
          runsFinished={state.runsFinished}
          runsRequested={state.runsRequested}
          fixedAllocationIntensity={fixedAllocationIntensity}
          defaultAllocationIntensity={defaultAllocationIntensity}
          fixedHonorsEquipmentRequirements={fixedHonorsEquipmentRequirements}
          runBlockedReason={describeCopiedAttributeProfilesBlock(copiedProfiles)}
          onRun={(options) => {
            if (copiedProfiles.type === CopiedAttributeProfilesType.Ready) {
              run(copiedProfiles.characterSpecs, options);
            }
          }}
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
          Showing the saved run for {STUDY_NAME_SLUGS[studyName]} ({state.runCountShown} runs
          {state.optionsShown !== null &&
            `, ${Math.round(state.optionsShown.allocationIntensity * 100)}% intensity, ` +
              `requirements ${state.optionsShown.honorsEquipmentRequirements ? "on" : "off"}`}
          ). Run a set to replace it.
        </p>
      )}

      {isPreparingTable ? (
        <div className="h-10 flex items-center gap-3 text-sm text-theme-muted">
          <div className="h-5 w-5">
            <LoadingSpinner />
          </div>
          {state.isLoadingSavedRun ? "reading the saved run..." : "building the table..."}
        </div>
      ) : (
        <div>
          <AnalysisSliceControls slice={slice} goalsInParty={goalsInParty} onChange={setSlice} />
          <div className="mb-4 flex items-center gap-4">
            <WriteFileButton label="save run" disabled={state.result === null} write={save} />
            {table !== null && renderTableActions !== undefined && renderTableActions(table)}
          </div>
        </div>
      )}

      <div className="bg-theme-base p-2 border border-theme-muted overflow-auto">
        <DataTable
          columns={columns}
          entries={rows.toReversed()}
          keyOf={roomKey}
          emptyMessage={table === null ? "no runs yet" : "no samples match this slice"}
          layoutOption={DataTableLayout.FitContent}
        />
      </div>
    </div>
  );
}

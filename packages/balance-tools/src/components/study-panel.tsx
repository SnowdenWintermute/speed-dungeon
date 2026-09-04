import { ReactNode, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { DataTable } from "@speed-dungeon/ui/atoms/DataTable";
import { DataTableColumn, DataTableLayout } from "@speed-dungeon/ui/atoms/DataTable/column";
import LoadingSpinner from "@speed-dungeon/ui/atoms/LoadingSpinner";
import { roomKey } from "../analysis-runs/analysis-sample.ts";
import { AnalysisSlice } from "../analysis-runs/analysis-slice.ts";
import { AnalysisTableRow } from "../analysis-runs/analysis-sample-table.ts";
import { DungeonRunAnalysisResults } from "../analysis-runs/dungeon-run-analysis.ts";
import { useBalanceToolsApplication } from "../state/context.tsx";
import { AnalysisOfStudy, StudyName } from "../studies/study-name.ts";
import { AnalysisRunControls } from "./analysis-run-controls.tsx";
import { AnalysisSliceControls } from "./analysis-slice-controls.tsx";
import { RunSetStatusMessages } from "./run-set-status-messages.tsx";
import { WriteFileButton } from "./write-file-button.tsx";

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
  /** whatever the study does with a finished table, such as generating a module from it */
  renderTableActions?: (table: TTable) => ReactNode;
}

function StudyPanelComponent<
  TStudy extends StudyName,
  TRow extends AnalysisTableRow,
  TTable extends StudyTable<TRow>,
>({
  studyName,
  columns,
  tableConstructor: TableConstructor,
  renderTableActions,
}: Props<TStudy, TRow, TTable>) {
  const panel = useBalanceToolsApplication().studies.panelFor(studyName);
  const { runSet, slice } = panel;
  const [table, setTable] = useState<null | TTable>(null);

  // building a table off 100MB of samples blocks, so it is queued behind the render that puts the
  // spinner up rather than done while rendering, where it would freeze an empty table into view
  const { result } = runSet;
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

  const isPreparingTable = runSet.isLoadingSavedRun || (result !== null && table === null);

  return (
    <div>
      <div className="mb-4">
        <AnalysisRunControls panel={panel} />
      </div>

      <RunSetStatusMessages runSet={runSet} studyName={studyName} />

      {isPreparingTable ? (
        <div className="h-10 flex items-center gap-3 text-sm text-theme-muted">
          <div className="h-5 w-5">
            <LoadingSpinner />
          </div>
          {runSet.isLoadingSavedRun ? "reading the saved run..." : "building the table..."}
        </div>
      ) : (
        <div>
          <AnalysisSliceControls panel={panel} />
          <div className="mb-4 flex items-center gap-4">
            <WriteFileButton
              label="save run"
              disabled={result === null}
              write={() => runSet.save()}
            />
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

// observer() resolves a generic component's type parameters to their constraints, so the wrapped
// component is given back the signature it was written with. it is the same function either way
export const StudyPanel = observer(StudyPanelComponent) as typeof StudyPanelComponent;

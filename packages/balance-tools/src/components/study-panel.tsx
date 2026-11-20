import { ReactNode, useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { DataTable } from "@speed-dungeon/ui/atoms/DataTable";
import { DataTableColumn, DataTableLayout } from "@speed-dungeon/ui/atoms/DataTable/column";
import LoadingSpinner from "@speed-dungeon/ui/atoms/LoadingSpinner";
import { roomKey } from "../analysis-runs/analysis-sample.ts";
import { AnalysisTableRow, StudyTable } from "../analysis-runs/analysis-sample-table.ts";
import { DungeonRunAnalysisResults } from "../analysis-runs/dungeon-run-analysis.ts";
import { useBalanceToolsApplication } from "../state/context.tsx";
import { AnalysisOfStudy, StudyName } from "../studies/study-name.ts";
import { intensityPercent } from "../analysis-runs/saved-run-paths.ts";
import { RadioGroup } from "@speed-dungeon/ui/atoms/RadioGroup";
import { AnalysisRunControls } from "./analysis-run-controls.tsx";
import { AnalysisSliceControls } from "./analysis-slice-controls.tsx";
import { RunSetStatusMessages } from "./run-set-status-messages.tsx";
import { WriteFileButton } from "./write-file-button.tsx";

interface Props<
  TStudy extends StudyName,
  TRow extends AnalysisTableRow,
  TTable extends StudyTable<TRow>,
> {
  studyName: TStudy;
  columns: DataTableColumn<TRow>[];
  tableConstructor: new (result: DungeonRunAnalysisResults[AnalysisOfStudy<TStudy>]) => TTable;
  renderTableActions?: (table: TTable) => ReactNode;
  aboveTable?: ReactNode;
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
  aboveTable,
}: Props<TStudy, TRow, TTable>) {
  const panel = useBalanceToolsApplication().studies.panelFor(studyName);
  const { runSet, slice } = panel;
  const { result } = runSet;
  // the panel that built the held table is the only one that ever renders these columns
  const table: null | TTable = panel.table instanceof TableConstructor ? panel.table : null;

  useEffect(() => {
    panel.buildTableIfNeeded(TableConstructor);
  }, [panel, result, TableConstructor]);

  const rows = useMemo(() => (table === null ? [] : table.selectRows(slice)), [table, slice]);

  const isPreparingTable =
    runSet.isLoadingSavedRun || panel.isBuildingTable || (result !== null && table === null);

  return (
    <div>
      <div className="mb-4">
        <AnalysisRunControls panel={panel} />
      </div>

      {panel.showableIntensityPercents.length > 0 && (
        <div className="mb-4 flex items-center gap-3 text-sm text-theme-muted">
          <span>showing</span>
          <RadioGroup
            title="intensity shown"
            value={intensityPercent(panel.shownIntensity)}
            setValue={(percent) => panel.showIntensity(percent / 100)}
            options={panel.showableIntensityPercents.map((percent) => ({
              title: panel.savedIntensityPercents.includes(percent) ? `${percent}%` : `${percent}%*`,
              value: percent,
            }))}
          />
          <span>* not saved</span>
        </div>
      )}

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
              disabled={!runSet.holdsUnsavedResult}
              write={() => panel.saveShown()}
            />
            <WriteFileButton
              label="save all"
              disabled={!panel.holdsUnsavedResults || panel.isAnyRunning}
              write={() => panel.saveAll()}
            />
            {table !== null && renderTableActions !== undefined && renderTableActions(table)}
          </div>
        </div>
      )}

      {aboveTable}

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

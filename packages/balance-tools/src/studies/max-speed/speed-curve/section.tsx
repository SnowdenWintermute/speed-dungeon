import { observer } from "mobx-react-lite";
import ButtonBasic from "@speed-dungeon/ui/atoms/ButtonBasic";
import { DataTable } from "@speed-dungeon/ui/atoms/DataTable";
import { DataTableLayout } from "@speed-dungeon/ui/atoms/DataTable/column";
import LoadingSpinner from "@speed-dungeon/ui/atoms/LoadingSpinner";
import { roomKey } from "../../../analysis-runs/analysis-sample.ts";
import { useBalanceToolsApplication } from "../../../state/context.tsx";
import { speedCurveColumns } from "./columns.tsx";
import { FitSummary } from "./fit-summary.tsx";

export const SpeedCurveSection = observer(() => {
  const { speedCurve } = useBalanceToolsApplication().studies;
  const { curve, isComputing, failureReason } = speedCurve;

  return (
    <div className="mb-4 bg-theme-base p-2 border border-theme-muted">
      <div className="mb-2 flex items-center gap-4">
        <span>speed curve</span>
        <ButtonBasic
          onClick={() => speedCurve.compute()}
          disabled={isComputing}
          extraStyles="bg-theme-recessed"
        >
          compute from saved runs
        </ButtonBasic>
        {isComputing && (
          <span className="flex items-center gap-3 text-sm text-theme-muted">
            <span className="h-5 w-5">
              <LoadingSpinner />
            </span>
            reading saved runs and fitting max attainable gear...
          </span>
        )}
      </div>

      {failureReason !== null && <p className="mb-2 text-theme-danger">{failureReason}</p>}

      {curve !== null && (
        <>
          <FitSummary curve={curve} />
          <div className="overflow-auto">
            <DataTable
              columns={speedCurveColumns(curve.fit)}
              entries={curve.inputs.rooms.toReversed()}
              keyOf={roomKey}
              emptyMessage="no room was reached by every tier's run"
              layoutOption={DataTableLayout.FitContent}
            />
          </div>
        </>
      )}
    </div>
  );
});

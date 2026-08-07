import { DataTable } from "@speed-dungeon/ui/atoms/DataTable";
import { DungeonRunAnalysis, DUNGEON_RUN_ANALYSIS_NAMES } from "@/analysis/dungeon-run-analysis";
import { useDungeonRunAnalysis } from "@/hooks/use-dungeon-run-analysis";
import { AnalysisRunControls } from "../AnalysisRunControls";
import { ACCURACY_AVAILABILITY_COLUMNS, roomKey } from "./accuracy-availability-columns";
import Divider from "@speed-dungeon/ui/atoms/Divider";

const DEFAULT_RUN_COUNT = 50;

export function AccuracyAvailabilityPanel() {
  const { state, run } = useDungeonRunAnalysis(DungeonRunAnalysis.AccuracyAvailability);

  return (
    <section>
      <h2 className="text-xl mb-1">
        {DUNGEON_RUN_ANALYSIS_NAMES[DungeonRunAnalysis.AccuracyAvailability]}
      </h2>
      <p className="text-sm text-theme-muted mb-4 max-w-3xl">
        Access to accuracy for the average character in a party of three, room by room.
      </p>

      <div className="mb-4">
        <AnalysisRunControls
          defaultRunCount={DEFAULT_RUN_COUNT}
          isRunning={state.isRunning}
          runsCompleted={state.runsCompleted}
          runsRequested={state.runsRequested}
          onRun={run}
        />
      </div>

      {state.failureReason !== null && (
        <p className="text-theme-danger mb-4">{state.failureReason}</p>
      )}

      {state.result === null ? (
        <p className="text-theme-muted">Nothing walked yet.</p>
      ) : (
        <>
          <p className="text-sm text-theme-muted mb-2">{state.runCountShown} runs, per character</p>
          <Divider extraStyles="mb-8" />
          <div className="bg-theme-base border p-2 px-4 border-theme-muted w-[1270px] mx-auto">
            <DataTable
              columns={ACCURACY_AVAILABILITY_COLUMNS}
              entries={state.result}
              keyOf={roomKey}
              emptyMessage="no rooms walked"
            />
          </div>
        </>
      )}
    </section>
  );
}

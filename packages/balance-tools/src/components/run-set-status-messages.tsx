import { observer } from "mobx-react-lite";
import { DungeonRunAnalysis } from "../analysis-runs/dungeon-run-analysis.ts";
import { AnalysisRunSetState } from "../state/analysis-run-set-state.ts";
import { STUDY_NAME_SLUGS, StudyName } from "../studies/study-name.ts";

interface Props {
  runSet: AnalysisRunSetState<DungeonRunAnalysis>;
  studyName: StudyName;
}

function describeOptionsShown(runSet: AnalysisRunSetState<DungeonRunAnalysis>) {
  const { optionsShown } = runSet;
  if (optionsShown === null) {
    return "";
  }

  return (
    `, ${Math.round(optionsShown.allocationIntensity * 100)}% intensity, ` +
    `requirements ${optionsShown.honorsEquipmentRequirements ? "on" : "off"}, ` +
    `armor class ${optionsShown.targetDummiesHaveArmorClass ? "on" : "off"}`
  );
}

export const RunSetStatusMessages = observer(({ runSet, studyName }: Props) => (
  <>
    {runSet.failureReason !== null && (
      <p className="mb-4 text-theme-danger">run set failed: {runSet.failureReason}</p>
    )}

    {runSet.runsFailed > 0 && (
      <p className="mb-4 text-theme-muted">
        {runSet.runsFailed} of {runSet.runCountShown} runs threw and were left out
      </p>
    )}

    {runSet.resultIsFromSavedRun && (
      <p className="mb-4 text-theme-muted">
        Showing the saved run for {STUDY_NAME_SLUGS[studyName]} ({runSet.runCountShown} runs
        {describeOptionsShown(runSet)}). Run a set to replace it.
      </p>
    )}
  </>
));

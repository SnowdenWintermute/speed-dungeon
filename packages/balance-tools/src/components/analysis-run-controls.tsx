import { observer } from "mobx-react-lite";
import { NormalizedPercentage } from "@speed-dungeon/common";
import ButtonBasic from "@speed-dungeon/ui/atoms/ButtonBasic";
import NumberInput from "@speed-dungeon/ui/atoms/NumberInput";
import { RadioGroup } from "@speed-dungeon/ui/atoms/RadioGroup";
import { Slider } from "@speed-dungeon/ui/atoms/Slider";
import { FULL_ALLOCATION_INTENSITY } from "../analysis-runs/allocation-intensity.ts";
import { DungeonRunAnalysis } from "../analysis-runs/dungeon-run-analysis.ts";
import { StudyPanelState } from "../state/study-panel-state.ts";
import { RunOptionCheckbox } from "./run-option-checkbox.tsx";

const MIN_RUN_COUNT = 1;
const MAX_RUN_COUNT = 2000;
const HONOR_REQUIREMENTS_LABEL = "honor equipment requirements";
const ARMOR_CLASS_LABEL = "target dummies have armor class";
const INTENSITY_STEP_PERCENT = 5;

const RUN_COUNT_OPTIONS = [
  { title: "600", value: 600 },
  { title: "300", value: 300 },
  { title: "100", value: 100 },
  { title: "10", value: 10 },
];

function toPercent(intensity: NormalizedPercentage) {
  return Math.round(intensity * 100);
}

interface Props {
  panel: StudyPanelState<DungeonRunAnalysis>;
}

export const AnalysisRunControls = observer(({ panel }: Props) => {
  const { runControls, runSet } = panel;

  return (
    <div>
      <div className="mb-2 flex items-center gap-3 text-sm text-theme-muted">
        <span>allocation intensity</span>
        <Slider
          title="allocation intensity"
          extraStyles="w-64"
          value={toPercent(panel.allocationIntensity)}
          setValue={(percent) => panel.setChosenAllocationIntensity(percent / 100)}
          min={0}
          max={toPercent(FULL_ALLOCATION_INTENSITY)}
          step={INTENSITY_STEP_PERCENT}
          disabled={runControls.fixedAllocationIntensity !== undefined}
        />
        <span className="text-theme-emphasis">{toPercent(panel.allocationIntensity)}%</span>
        {runControls.designedAllocationIntensity !== undefined && (
          <span>designed {toPercent(runControls.designedAllocationIntensity)}%</span>
        )}
      </div>
      <div className="flex items-end gap-4">
        <div className="flex flex-col text-sm text-theme-muted">
          <span className="mb-1">runs</span>

          <RadioGroup
            title="run count presets"
            extraStyles="mb-2"
            value={panel.runCount}
            setValue={(presetRunCount) => panel.setRunCountText(`${presetRunCount}`)}
            options={RUN_COUNT_OPTIONS}
          />
        </div>

        <NumberInput
          name="run count"
          value={panel.runCountText}
          onChange={(runCountText) => panel.setRunCountText(runCountText)}
          min={MIN_RUN_COUNT}
          max={MAX_RUN_COUNT}
          onEnter={() => panel.runIfPossible()}
          className="h-10 w-28 bg-theme-base border border-theme-muted text-theme-emphasis px-2"
        />

        <ButtonBasic
          onClick={() => panel.runIfPossible()}
          disabled={!panel.canRun}
          extraStyles="bg-theme-recessed"
        >
          {runSet.isRunning ? "running..." : "run set"}
        </ButtonBasic>

        <RunOptionCheckbox
          label={HONOR_REQUIREMENTS_LABEL}
          checked={panel.honorsEquipmentRequirements}
          isFixed={runControls.fixedHonorsEquipmentRequirements !== undefined}
          setChecked={(checked) => panel.setChosenHonorsEquipmentRequirements(checked)}
        />

        <RunOptionCheckbox
          label={ARMOR_CLASS_LABEL}
          checked={panel.targetDummiesHaveArmorClass}
          isFixed={runControls.fixedTargetDummiesHaveArmorClass !== undefined}
          setChecked={(checked) => panel.setChosenTargetDummiesHaveArmorClass(checked)}
        />

        {runSet.isRunning && (
          <span className="h-10 flex items-center text-sm text-theme-muted">
            {runSet.runsFinished} / {runSet.runsRequested} runs walked
          </span>
        )}

        {panel.copiedProfiles.blockedReason !== null && (
          <span className="h-10 flex items-center text-sm text-theme-muted">
            {panel.copiedProfiles.blockedReason}
          </span>
        )}
      </div>
    </div>
  );
});

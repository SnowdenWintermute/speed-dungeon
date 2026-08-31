import { useState } from "react";
import { NormalizedPercentage } from "@speed-dungeon/common";
import ButtonBasic from "@speed-dungeon/ui/atoms/ButtonBasic";
import NumberInput from "@speed-dungeon/ui/atoms/NumberInput";
import { RadioGroup } from "@speed-dungeon/ui/atoms/RadioGroup";
import { Slider } from "@speed-dungeon/ui/atoms/Slider";
import { FULL_ALLOCATION_INTENSITY } from "../analysis-runs/allocation-intensity.ts";
import { AnalysisRunSetOptions } from "../analysis-runs/run-set-worker-messages.ts";
import { useFixableState } from "../hooks/use-fixable-state.ts";
import { RunOptionCheckbox } from "./run-option-checkbox.tsx";

const MIN_RUN_COUNT = 1;
const MAX_RUN_COUNT = 2000;
const HONOR_REQUIREMENTS_LABEL = "honor equipment requirements";
const ARMOR_CLASS_LABEL = "target dummies have armor class";
const INTENSITY_STEP_PERCENT = 5;

function toPercent(intensity: NormalizedPercentage) {
  return Math.round(intensity * 100);
}

interface Props {
  defaultRunCount: number;
  isRunning: boolean;
  runsFinished: number;
  runsRequested: number;
  defaultAllocationIntensity?: NormalizedPercentage;
  /** set by a study whose derivation only means anything at one intensity; absent lets the user pick */
  fixedAllocationIntensity?: NormalizedPercentage;
  /** the share the study's goal is designed to be spent at, quoted beside whatever is dialed in */
  designedAllocationIntensity?: NormalizedPercentage;
  /** set by a study that is only itself with requirements handled one way; absent lets the user pick */
  fixedHonorsEquipmentRequirements?: boolean;
  /** set by a study whose goal never samples against a dummy, so the toggle would do nothing */
  fixedTargetDummiesHaveArmorClass?: boolean;
  /** why a set cannot be walked yet, such as a source study this one copies from not being saved */
  runBlockedReason?: null | string;
  onRun: (options: AnalysisRunSetOptions) => void;
}

const RUN_COUNT_OPTIONS = [
  { title: "600", value: 600 },
  { title: "300", value: 300 },
  { title: "100", value: 100 },
  { title: "10", value: 10 },
];

export function AnalysisRunControls({
  defaultRunCount,
  isRunning,
  runsFinished,
  runsRequested,
  defaultAllocationIntensity,
  fixedAllocationIntensity,
  designedAllocationIntensity,
  fixedHonorsEquipmentRequirements,
  fixedTargetDummiesHaveArmorClass,
  runBlockedReason = null,
  onRun,
}: Props) {
  const [runCountText, setRunCountText] = useState(`${defaultRunCount}`);

  const intensity = useFixableState(
    fixedAllocationIntensity,
    defaultAllocationIntensity ?? FULL_ALLOCATION_INTENSITY
  );
  const requirementHandling = useFixableState(fixedHonorsEquipmentRequirements, false);
  const armorClassHandling = useFixableState(fixedTargetDummiesHaveArmorClass, false);

  const allocationIntensity = intensity.value;
  const honorsEquipmentRequirements = requirementHandling.value;
  const targetDummiesHaveArmorClass = armorClassHandling.value;

  const runCount = Number(runCountText);
  const runCountIsUsable = Number.isInteger(runCount) && runCount >= MIN_RUN_COUNT;

  const canRun = runCountIsUsable && !isRunning && runBlockedReason === null;

  function handleRun() {
    if (!canRun) {
      return;
    }
    onRun({
      runCount,
      allocationIntensity,
      honorsEquipmentRequirements,
      targetDummiesHaveArmorClass,
    });
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-3 text-sm text-theme-muted">
        <span>allocation intensity</span>
        <Slider
          title="allocation intensity"
          extraStyles="w-64"
          value={toPercent(allocationIntensity)}
          setValue={(percent) => intensity.setChosen((percent / 100) as NormalizedPercentage)}
          min={0}
          max={toPercent(FULL_ALLOCATION_INTENSITY)}
          step={INTENSITY_STEP_PERCENT}
          disabled={intensity.isFixed}
        />
        <span className="text-theme-emphasis">{toPercent(allocationIntensity)}%</span>
        {designedAllocationIntensity !== undefined && (
          <span>designed {toPercent(designedAllocationIntensity)}%</span>
        )}
      </div>
      <div className="flex items-end gap-4">
        <div className="flex flex-col text-sm text-theme-muted">
          <span className="mb-1">runs</span>

          <RadioGroup
            title="run count presets"
            extraStyles="mb-2"
            value={runCount}
            setValue={(presetRunCount) => setRunCountText(`${presetRunCount}`)}
            options={RUN_COUNT_OPTIONS}
          />
        </div>

        <NumberInput
          name="run count"
          value={runCountText}
          onChange={setRunCountText}
          min={MIN_RUN_COUNT}
          max={MAX_RUN_COUNT}
          onEnter={handleRun}
          className="h-10 w-28 bg-theme-base border border-theme-muted text-theme-emphasis px-2"
        />

        <ButtonBasic onClick={handleRun} disabled={!canRun} extraStyles="bg-theme-recessed">
          {isRunning ? "running..." : "run set"}
        </ButtonBasic>

        <RunOptionCheckbox
          label={HONOR_REQUIREMENTS_LABEL}
          checked={honorsEquipmentRequirements}
          isFixed={requirementHandling.isFixed}
          setChecked={requirementHandling.setChosen}
        />

        <RunOptionCheckbox
          label={ARMOR_CLASS_LABEL}
          checked={targetDummiesHaveArmorClass}
          isFixed={armorClassHandling.isFixed}
          setChecked={armorClassHandling.setChosen}
        />

        {isRunning && (
          <span className="h-10 flex items-center text-sm text-theme-muted">
            {runsFinished} / {runsRequested} runs walked
          </span>
        )}

        {runBlockedReason !== null && (
          <span className="h-10 flex items-center text-sm text-theme-muted">
            {runBlockedReason}
          </span>
        )}
      </div>
    </div>
  );
}

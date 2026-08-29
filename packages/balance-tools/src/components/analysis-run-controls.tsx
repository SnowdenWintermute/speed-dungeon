import { useState } from "react";
import { NormalizedPercentage } from "@speed-dungeon/common";
import ButtonBasic from "@speed-dungeon/ui/atoms/ButtonBasic";
import NumberInput from "@speed-dungeon/ui/atoms/NumberInput";
import { RadioGroup } from "@speed-dungeon/ui/atoms/RadioGroup";
import { FULL_ALLOCATION_INTENSITY } from "../analysis-runs/allocation-intensity.ts";
import { AnalysisRunSetOptions } from "../analysis-runs/run-set-worker-messages.ts";

const MIN_RUN_COUNT = 1;
const MAX_RUN_COUNT = 2000;

interface Props {
  defaultRunCount: number;
  isRunning: boolean;
  runsFinished: number;
  runsRequested: number;
  defaultAllocationIntensity?: NormalizedPercentage;
  /** set by a study whose derivation only means anything at one intensity; absent lets the user pick */
  fixedAllocationIntensity?: NormalizedPercentage;
  onRun: (options: AnalysisRunSetOptions) => void;
}

const ALLOCATION_INTENSITY_OPTIONS: { title: string; value: NormalizedPercentage }[] = [
  { title: "100%", value: FULL_ALLOCATION_INTENSITY },
  { title: "80%", value: 0.8 },
  { title: "60%", value: 0.6 },
  { title: "40%", value: 0.4 },
];

const RUN_COUNT_OPTIONS = [
  { title: "500", value: 500 },
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
  onRun,
}: Props) {
  const [runCountText, setRunCountText] = useState(`${defaultRunCount}`);
  const [chosenAllocationIntensity, setChosenAllocationIntensity] = useState(
    fixedAllocationIntensity ?? defaultAllocationIntensity ?? FULL_ALLOCATION_INTENSITY
  );
  const [honorsEquipmentRequirements, setHonorsEquipmentRequirements] = useState(false);

  const intensityIsFixed = fixedAllocationIntensity !== undefined;
  const allocationIntensity = fixedAllocationIntensity ?? chosenAllocationIntensity;

  const runCount = Number(runCountText);
  const runCountIsUsable = Number.isInteger(runCount) && runCount >= MIN_RUN_COUNT;

  function handleRun() {
    if (!runCountIsUsable || isRunning) {
      return;
    }
    onRun({ runCount, allocationIntensity, honorsEquipmentRequirements });
  }

  return (
    <div>
      <div className="flex flex-col text-sm text-theme-muted">
        <RadioGroup
          title="allocation intensity presets"
          extraStyles="mb-2"
          value={allocationIntensity}
          setValue={setChosenAllocationIntensity}
          options={ALLOCATION_INTENSITY_OPTIONS}
          disabled={intensityIsFixed}
        />
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

        <ButtonBasic
          onClick={handleRun}
          disabled={isRunning || !runCountIsUsable}
          extraStyles="bg-theme-base"
        >
          {isRunning ? "running..." : "run set"}
        </ButtonBasic>

        <label className="h-10 flex items-center gap-2 text-sm text-theme-muted">
          <input
            type="checkbox"
            checked={honorsEquipmentRequirements}
            onChange={(event) => setHonorsEquipmentRequirements(event.target.checked)}
          />
          honor equipment requirements
        </label>

        {isRunning && (
          <span className="h-10 flex items-center text-sm text-theme-muted">
            {runsFinished} / {runsRequested} runs walked
          </span>
        )}
      </div>
    </div>
  );
}

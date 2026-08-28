import { useState } from "react";
import { NormalizedPercentage } from "@speed-dungeon/common";
import ButtonBasic from "@speed-dungeon/ui/atoms/ButtonBasic";
import NumberInput from "@speed-dungeon/ui/atoms/NumberInput";
import { RadioGroup } from "@speed-dungeon/ui/atoms/RadioGroup";
import { AnalysisRunOptions } from "@/analysis-runs/run-set-worker-messages";

const MIN_RUN_COUNT = 1;
const MAX_RUN_COUNT = 2000;
const DEFAULT_ALLOCATION_INTENSITY: NormalizedPercentage = 1;

interface Props {
  defaultRunCount: number;
  isRunning: boolean;
  runsFinished: number;
  runsRequested: number;
  defaultAllocationIntensity?: NormalizedPercentage;
  /** set by a study whose derivation only means anything at one intensity; absent lets the user pick */
  fixedAllocationIntensity?: NormalizedPercentage;
  onRun: (options: AnalysisRunOptions) => void;
}

const ALLOCATION_INTENSITY_OPTIONS: { title: string; value: NormalizedPercentage }[] = [
  { title: "100%", value: 1 },
  { title: "80%", value: 0.8 },
  { title: "60%", value: 0.6 },
  { title: "40%", value: 0.4 },
];

const RUN_COUNT_OPTIONS = [
  {
    title: "500",
    value: 500,
  },
  {
    title: "100",
    value: 100,
  },
  {
    title: "10",
    value: 10,
  },
];

export function AnalysisRunControls(props: Props) {
  const [runCountText, setRunCountText] = useState(`${props.defaultRunCount}`);

  let initialAllocationIntensity = props.fixedAllocationIntensity;
  if (initialAllocationIntensity === undefined) {
    initialAllocationIntensity = props.defaultAllocationIntensity;
  }
  if (initialAllocationIntensity === undefined) {
    initialAllocationIntensity = DEFAULT_ALLOCATION_INTENSITY;
  }

  const [chosenAllocationIntensity, setChosenAllocationIntensity] = useState(
    initialAllocationIntensity
  );
  const [honorsEquipmentRequirements, setHonorsEquipmentRequirements] = useState(false);

  const intensityIsFixed = props.fixedAllocationIntensity !== undefined;
  const allocationIntensity = props.fixedAllocationIntensity ?? chosenAllocationIntensity;

  const runCount = Number(runCountText);
  const runCountIsUsable = Number.isInteger(runCount) && runCount >= MIN_RUN_COUNT;

  function handleRun() {
    if (!runCountIsUsable || props.isRunning) {
      return;
    }
    props.onRun({ runCount, allocationIntensity, honorsEquipmentRequirements });
  }

  return (
    <div className="">
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
          disabled={props.isRunning || !runCountIsUsable}
          extraStyles="bg-theme-base"
        >
          {props.isRunning ? "running..." : "run set"}
        </ButtonBasic>

        <label className="h-10 flex items-center gap-2 text-sm text-theme-muted">
          <input
            type="checkbox"
            checked={honorsEquipmentRequirements}
            onChange={(event) => setHonorsEquipmentRequirements(event.target.checked)}
          />
          honor equipment requirements
        </label>

        {props.isRunning && (
          <span className="h-10 flex items-center text-sm text-theme-muted">
            {props.runsFinished} / {props.runsRequested} runs walked
          </span>
        )}
      </div>
    </div>
  );
}

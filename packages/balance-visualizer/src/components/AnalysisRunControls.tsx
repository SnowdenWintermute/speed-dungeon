import { useState } from "react";
import ButtonBasic from "@speed-dungeon/ui/atoms/ButtonBasic";
import NumberInput from "@speed-dungeon/ui/atoms/NumberInput";

const MIN_RUN_COUNT = 1;
const MAX_RUN_COUNT = 2000;

interface Props {
  defaultRunCount: number;
  isRunning: boolean;
  runsCompleted: number;
  runsRequested: number;
  onRun: (runCount: number) => void;
}

export function AnalysisRunControls(props: Props) {
  const [runCountText, setRunCountText] = useState(`${props.defaultRunCount}`);

  const runCount = Number(runCountText);
  const runCountIsUsable = Number.isInteger(runCount) && runCount >= MIN_RUN_COUNT;

  function handleRun() {
    if (!runCountIsUsable || props.isRunning) {
      return;
    }
    props.onRun(runCount);
  }

  return (
    <div className="flex items-end gap-4">
      <label className="flex flex-col text-sm text-theme-muted">
        <span className="mb-1">runs</span>
        <NumberInput
          name="run count"
          value={runCountText}
          onChange={setRunCountText}
          min={MIN_RUN_COUNT}
          max={MAX_RUN_COUNT}
          onEnter={handleRun}
          className="h-10 w-28 bg-theme-sunken border border-theme-muted text-theme-emphasis px-2"
        />
      </label>

      <ButtonBasic onClick={handleRun} disabled={props.isRunning || !runCountIsUsable}>
        {props.isRunning ? "running..." : "regenerate"}
      </ButtonBasic>

      {props.isRunning && (
        <span className="h-10 flex items-center text-sm text-theme-muted">
          {props.runsCompleted} / {props.runsRequested} runs walked
        </span>
      )}
    </div>
  );
}

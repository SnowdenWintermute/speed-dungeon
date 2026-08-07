import { useCallback, useEffect, useRef, useState } from "react";
import { DungeonRunAnalysis, DungeonRunAnalysisResults } from "@/analysis/dungeon-run-analysis";
import {
  DungeonRunWorkerMessage,
  DungeonRunWorkerMessageType,
} from "@/analysis/dungeon-run-worker-messages";

export interface DungeonRunAnalysisState<TResult> {
  result: null | TResult;
  /** How many runs the displayed result was built from. Not the pending count while a run is in
   * flight — the last finished result stays on screen until it is replaced. */
  runCountShown: null | number;
  runsCompleted: number;
  runsRequested: number;
  isRunning: boolean;
  failureReason: null | string;
}

function initialState<TResult>(): DungeonRunAnalysisState<TResult> {
  return {
    result: null,
    runCountShown: null,
    runsCompleted: 0,
    runsRequested: 0,
    isRunning: false,
    failureReason: null,
  };
}

export function useDungeonRunAnalysis<TAnalysis extends DungeonRunAnalysis>(analysis: TAnalysis) {
  type Result = DungeonRunAnalysisResults[TAnalysis];

  const workerRef = useRef<null | Worker>(null);
  const [state, setState] = useState<DungeonRunAnalysisState<Result>>(initialState);

  useEffect(() => () => workerRef.current?.terminate(), []);

  // a fresh worker per request, so starting a run cancels one already in flight rather than
  // interleaving two streams of progress messages
  const run = useCallback(
    (runCount: number) => {
      workerRef.current?.terminate();

      const worker = new Worker(new URL("../analysis/dungeon-run-worker.ts", import.meta.url), {
        type: "module",
      });
      workerRef.current = worker;

      setState((current) => ({
        ...current,
        runsCompleted: 0,
        runsRequested: runCount,
        isRunning: true,
        failureReason: null,
      }));

      worker.onmessage = ({ data }: MessageEvent<DungeonRunWorkerMessage<TAnalysis>>) => {
        switch (data.type) {
          case DungeonRunWorkerMessageType.Progress:
            setState((current) => ({ ...current, runsCompleted: data.runsCompleted }));
            break;
          case DungeonRunWorkerMessageType.Complete:
            setState((current) => ({
              ...current,
              result: data.result,
              runCountShown: current.runsRequested,
              isRunning: false,
            }));
            worker.terminate();
            break;
          case DungeonRunWorkerMessageType.Failed:
            setState((current) => ({ ...current, isRunning: false, failureReason: data.reason }));
            worker.terminate();
            break;
        }
      };

      worker.onerror = (event) => {
        setState((current) => ({ ...current, isRunning: false, failureReason: event.message }));
        worker.terminate();
      };

      worker.postMessage({ analysis, runCount });
    },
    [analysis]
  );

  return { state, run };
}

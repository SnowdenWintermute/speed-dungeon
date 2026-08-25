import { useCallback, useEffect, useRef, useState } from "react";
import { AnalysisCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";
import {
  DungeonRunAnalysis,
  DungeonRunAnalysisResults,
} from "@/analysis-runs/dungeon-run-analysis";
import {
  AnalysisRunSetWorkerMessage,
  AnalysisRunSetWorkerMessageType,
} from "@/analysis-runs/run-set-worker-messages";

export interface AnalysisRunSetState<AnalysisType extends DungeonRunAnalysis> {
  /** the raw result, so each study's panel owns building its own table from it */
  result: null | DungeonRunAnalysisResults[AnalysisType];
  /** how many runs the shown result was built from, not the pending count while one is running */
  runCountShown: null | number;
  runsFinished: number;
  runsRequested: number;
  runsFailed: number;
  isRunning: boolean;
  failureReason: null | string;
}

function initialState<AnalysisType extends DungeonRunAnalysis>(): AnalysisRunSetState<AnalysisType> {
  return {
    result: null,
    runCountShown: null,
    runsFinished: 0,
    runsRequested: 0,
    runsFailed: 0,
    isRunning: false,
    failureReason: null,
  };
}

export function useAnalysisRunSet<AnalysisType extends DungeonRunAnalysis>(
  analysis: AnalysisType
) {
  const workerRef = useRef<null | Worker>(null);
  const [state, setState] = useState(initialState<AnalysisType>);

  useEffect(() => () => workerRef.current?.terminate(), []);

  // a fresh worker per request, so starting a set cancels one already in flight rather than
  // interleaving two streams of progress messages
  const run = useCallback(
    (characterSpecs: AnalysisCharacterSpecification[], runCount: number) => {
      workerRef.current?.terminate();

      const worker = new Worker(new URL("../analysis-runs/run-set-worker.ts", import.meta.url), {
        type: "module",
      });
      workerRef.current = worker;

      setState((current) => ({
        ...current,
        runsFinished: 0,
        runsRequested: runCount,
        runsFailed: 0,
        isRunning: true,
        failureReason: null,
      }));

      worker.onmessage = ({ data }: MessageEvent<AnalysisRunSetWorkerMessage<AnalysisType>>) => {
        switch (data.type) {
          case AnalysisRunSetWorkerMessageType.Progress:
            setState((current) => ({ ...current, runsFinished: data.runsFinished }));
            break;
          case AnalysisRunSetWorkerMessageType.Complete:
            setState((current) => ({
              ...current,
              result: data.result,
              runCountShown: current.runsRequested,
              runsFailed: data.result.runsFailed,
              isRunning: false,
            }));
            worker.terminate();
            break;
          case AnalysisRunSetWorkerMessageType.Failed:
            setState((current) => ({ ...current, isRunning: false, failureReason: data.reason }));
            worker.terminate();
            break;
        }
      };

      worker.onerror = (event) => {
        setState((current) => ({ ...current, isRunning: false, failureReason: event.message }));
        worker.terminate();
      };

      worker.postMessage({
        analysis,
        characterSpecs: characterSpecs.map((spec) => spec.toSerialized()),
        runCount,
      });
    },
    [analysis]
  );

  return { state, run };
}

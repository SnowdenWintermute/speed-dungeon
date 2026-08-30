import { useCallback, useEffect, useRef, useState } from "react";
import { AnalysisCharacterSpecification } from "../analysis-subjects/analysis-character-specification.ts";
import {
  AnalysisRunSetOptions,
  AnalysisRunSetWorkerMessage,
  AnalysisRunSetWorkerMessageType,
  AnalysisRunSetWorkerRequest,
} from "../analysis-runs/run-set-worker-messages.ts";
import {
  SavedRun,
  savedRunFetchUrl,
  savedRunWritePath,
} from "../analysis-runs/saved-run-paths.ts";
import {
  DungeonRunAnalysis,
  DungeonRunAnalysisResults,
} from "../analysis-runs/dungeon-run-analysis.ts";
import { StudyName } from "../studies/study-name.ts";
import { writeGeneratedFile } from "../write-generated-file.ts";

export interface AnalysisRunSetState<AnalysisType extends DungeonRunAnalysis> {
  result: null | DungeonRunAnalysisResults[AnalysisType];
  runCountShown: null | number;
  /** what the shown result was walked at; null for a saved run from before these were recorded */
  optionsShown: null | AnalysisRunSetOptions;
  runsFinished: number;
  runsRequested: number;
  runsFailed: number;
  isRunning: boolean;
  /** a saved run is 100MB of json, so the wait is long enough to need saying */
  isLoadingSavedRun: boolean;
  failureReason: null | string;
  /** so a run loaded from disk is never mistaken for one just walked */
  resultIsFromSavedRun: boolean;
}

function initialState<
  AnalysisType extends DungeonRunAnalysis,
>(): AnalysisRunSetState<AnalysisType> {
  return {
    result: null,
    runCountShown: null,
    optionsShown: null,
    runsFinished: 0,
    runsRequested: 0,
    runsFailed: 0,
    isRunning: false,
    isLoadingSavedRun: false,
    failureReason: null,
    resultIsFromSavedRun: false,
  };
}

export function useAnalysisRunSet<AnalysisType extends DungeonRunAnalysis>(
  studyName: StudyName,
  analysis: AnalysisType
) {
  const workerRef = useRef<null | Worker>(null);
  const [state, setState] = useState(initialState<AnalysisType>);

  useEffect(() => () => workerRef.current?.terminate(), []);

  // a study's last saved run stands in until one is walked, so a hot reload does not cost a set.
  // no saved run is the ordinary first-use case, so a miss is silent
  useEffect(() => {
    let isCurrent = true;
    setState({ ...initialState<AnalysisType>(), isLoadingSavedRun: true });

    fetch(savedRunFetchUrl(studyName))
      .then((response) => (response.ok ? response.json() : null))
      .then((saved: null | SavedRun<AnalysisType>) => {
        if (!isCurrent) {
          return;
        }
        setState((current) =>
          saved === null || current.result !== null || current.isRunning
            ? { ...current, isLoadingSavedRun: false }
            : {
                ...current,
                result: saved.result,
                runCountShown: saved.runCount,
                optionsShown: saved.options ?? null,
                runsFailed: saved.result.runsFailed,
                isLoadingSavedRun: false,
                resultIsFromSavedRun: true,
              }
        );
      })
      .catch(() => {
        if (isCurrent) {
          setState((current) => ({ ...current, isLoadingSavedRun: false }));
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [studyName]);

  const run = useCallback(
    (characterSpecs: AnalysisCharacterSpecification[], options: AnalysisRunSetOptions) => {
      const { runCount } = options;
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
              optionsShown: options,
              runsFailed: data.result.runsFailed,
              isRunning: false,
              resultIsFromSavedRun: false,
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

      // Worker.postMessage takes `any`, so the request is annotated to be checked against the shape
      // the worker reads
      const request: AnalysisRunSetWorkerRequest = {
        ...options,
        analysis,
        characterSpecs: characterSpecs.map((spec) => spec.toSerialized()),
      };
      worker.postMessage(request);
    },
    [analysis]
  );

  // nothing saves on its own: a comparison run must never overwrite the run a generated file came from
  const save = useCallback(async () => {
    const { result, runCountShown, optionsShown } = state;
    if (result === null || runCountShown === null) {
      throw new Error("there is no run to save");
    }
    const saved: SavedRun<AnalysisType> = {
      runCount: runCountShown,
      result,
      ...(optionsShown === null ? {} : { options: optionsShown }),
    };
    return writeGeneratedFile(savedRunWritePath(studyName), JSON.stringify(saved));
  }, [state, studyName]);

  return { state, run, save };
}

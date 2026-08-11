import { useCallback, useEffect, useRef, useState } from "react";
import { DungeonRunAnalysis, DungeonRunAnalysisResults } from "@/analysis/dungeon-run-analysis";
import {
  DungeonRunWorkerMessage,
  DungeonRunWorkerMessageType,
  DungeonRunWorkerRequest,
} from "@/analysis/dungeon-run-worker/messages";

/** One field rather than two, because a result and the number of runs behind it are only meaningful
 * together — anything reporting the figure alongside the table would otherwise have to handle a null
 * run count that cannot happen. */
export interface CompletedAnalysis<TResult> {
  result: TResult;
  /** Not the pending count while a run is in flight — the last finished result stays on screen until
   * it is replaced. */
  runCount: number;
  /** Wall clock from the click, so worker startup is counted where it is actually paid. In dev each
   * worker loads its module graph from the dev server rather than one bundled file, which is the
   * first thing to suspect when splitting the work does not speed it up. */
  elapsedMs: number;
  workerCount: number;
}

export interface DungeonRunAnalysisState<TResult> {
  completed: null | CompletedAnalysis<TResult>;
  runsCompleted: number;
  runsRequested: number;
  isRunning: boolean;
  failureReason: null | string;
}

/** How the partial results of several workers become one. An analysis that cannot be split provides
 * none and runs on a single worker. */
export type MergeResults<TResult> = (parts: TResult[]) => TResult;

/** Leaves a core for the page itself, so the browser stays responsive while a few hundred walks run.
 * hardwareConcurrency is absent on some browsers, where one worker is the honest fallback. */
const SPARE_CORES = 1;
const DEFAULT_WORKER_COUNT = 1;

/** For unknown reasons, higher caps are either slower or don't save much time */
const MAX_WORKERS = 4;

function usableWorkerCount() {
  const cores = navigator.hardwareConcurrency;
  if (cores === undefined) {
    return DEFAULT_WORKER_COUNT;
  }
  return Math.max(1, Math.min(MAX_WORKERS, cores - SPARE_CORES));
}

/** Below this a worker is not worth starting, for two reasons that happen to agree.
 *
 * A worker loads the whole simulation before it walks anything, which costs more than a couple of
 * runs are worth: splitting 50 runs across 19 cores left each worker under three runs to do and
 * spent the entire gain on startup.
 *
 * And the damage analysis seats every combo once per cycle, which takes this many runs. A worker
 * that never finishes a cycle only ever covers the front of it, so thin slices skew coverage as
 * well as wasting time. */
const MIN_RUNS_PER_WORKER = 8;

/** Splits as evenly as the count allows, giving the remainder to the earliest workers. */
function runCountsPerWorker(runCount: number, workerCount: number) {
  const worthStarting = Math.floor(runCount / MIN_RUNS_PER_WORKER);
  const usable = Math.max(1, Math.min(workerCount, worthStarting));

  return Array.from(
    { length: usable },
    (_, index) => Math.floor(runCount / usable) + (index < runCount % usable ? 1 : 0)
  );
}

function initialState<TResult>(): DungeonRunAnalysisState<TResult> {
  return {
    completed: null,
    runsCompleted: 0,
    runsRequested: 0,
    isRunning: false,
    failureReason: null,
  };
}

export function useDungeonRunAnalysis<TAnalysis extends DungeonRunAnalysis>(
  analysis: TAnalysis,
  mergeResults?: MergeResults<DungeonRunAnalysisResults[TAnalysis]>
) {
  type Result = DungeonRunAnalysisResults[TAnalysis];

  const workersRef = useRef<Worker[]>([]);
  const [state, setState] = useState<DungeonRunAnalysisState<Result>>(initialState);

  const terminateAll = () => {
    for (const worker of workersRef.current) {
      worker.terminate();
    }
    workersRef.current = [];
  };

  useEffect(() => () => terminateAll(), []);

  // fresh workers per request, so starting a run cancels one already in flight rather than
  // interleaving two streams of progress messages
  const run = useCallback(
    (runCount: number, options: Pick<DungeonRunWorkerRequest, "draw"> = {}) => {
      terminateAll();

      // splitting needs a way to put the pieces back together, and for most results that is not a
      // concatenation — a percentile cannot be recovered from other percentiles
      const runCounts = runCountsPerWorker(
        runCount,
        mergeResults === undefined ? 1 : usableWorkerCount()
      );

      setState((current) => ({
        ...current,
        runsCompleted: 0,
        runsRequested: runCount,
        isRunning: true,
        failureReason: null,
      }));

      const started = performance.now();
      const completedPerWorker = new Array<number>(runCounts.length).fill(0);
      const resultPerWorker = new Array<undefined | Result>(runCounts.length).fill(undefined);

      const finishIfAllDone = () => {
        const results = resultPerWorker.filter((result) => result !== undefined);
        if (results.length < runCounts.length) {
          return;
        }
        setState((current) => ({
          ...current,
          // one worker means no merge is needed, and an analysis without a merge only ever has one
          completed: {
            result: mergeResults === undefined ? results[0]! : mergeResults(results),
            runCount: current.runsRequested,
            elapsedMs: performance.now() - started,
            workerCount: runCounts.length,
          },
          isRunning: false,
        }));
        terminateAll();
      };

      workersRef.current = runCounts.map((workerRunCount, index) => {
        const worker = new Worker(
          new URL("../analysis/dungeon-run-worker/index.ts", import.meta.url),
          { type: "module" }
        );

        worker.onmessage = ({ data }: MessageEvent<DungeonRunWorkerMessage<TAnalysis>>) => {
          switch (data.type) {
            case DungeonRunWorkerMessageType.Progress:
              completedPerWorker[index] = data.runsCompleted;
              setState((current) => ({
                ...current,
                runsCompleted: completedPerWorker.reduce((sum, walked) => sum + walked, 0),
              }));
              break;
            case DungeonRunWorkerMessageType.Complete:
              resultPerWorker[index] = data.result;
              finishIfAllDone();
              break;
            case DungeonRunWorkerMessageType.Failed:
              setState((current) => ({ ...current, isRunning: false, failureReason: data.reason }));
              terminateAll();
              break;
          }
        };

        worker.onerror = (event) => {
          setState((current) => ({ ...current, isRunning: false, failureReason: event.message }));
          terminateAll();
        };

        worker.postMessage({ analysis, runCount: workerRunCount, workerIndex: index, ...options });
        return worker;
      });
    },
    [analysis, mergeResults]
  );

  return { state, run };
}

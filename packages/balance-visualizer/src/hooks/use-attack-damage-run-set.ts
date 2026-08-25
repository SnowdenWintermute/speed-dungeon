import { useCallback, useEffect, useRef, useState } from "react";
import { AnalysisCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";
import {
  AttackDamageRunSetWorkerMessage,
  AttackDamageRunSetWorkerMessageType,
} from "@/analysis-runs/attack-damage/run-set-worker-messages";
import { AttackDamageTable } from "@/tables/attack-damage/table";

export interface AttackDamageRunSetState {
  table: null | AttackDamageTable;
  /** how many runs the shown table was built from, not the pending count while one is running */
  runCountShown: null | number;
  runsFinished: number;
  runsRequested: number;
  runsFailed: number;
  isRunning: boolean;
  failureReason: null | string;
}

const INITIAL_STATE: AttackDamageRunSetState = {
  table: null,
  runCountShown: null,
  runsFinished: 0,
  runsRequested: 0,
  runsFailed: 0,
  isRunning: false,
  failureReason: null,
};

export function useAttackDamageRunSet() {
  const workerRef = useRef<null | Worker>(null);
  const [state, setState] = useState(INITIAL_STATE);

  useEffect(() => () => workerRef.current?.terminate(), []);

  // a fresh worker per request, so starting a set cancels one already in flight rather than
  // interleaving two streams of progress messages
  const run = useCallback(
    (characterSpecs: AnalysisCharacterSpecification[], runCount: number) => {
      workerRef.current?.terminate();

      const worker = new Worker(
        new URL("../analysis-runs/attack-damage/run-set-worker.ts", import.meta.url),
        { type: "module" }
      );
      workerRef.current = worker;

      setState((current) => ({
        ...current,
        runsFinished: 0,
        runsRequested: runCount,
        runsFailed: 0,
        isRunning: true,
        failureReason: null,
      }));

      worker.onmessage = ({ data }: MessageEvent<AttackDamageRunSetWorkerMessage>) => {
        switch (data.type) {
          case AttackDamageRunSetWorkerMessageType.Progress:
            setState((current) => ({ ...current, runsFinished: data.runsFinished }));
            break;
          case AttackDamageRunSetWorkerMessageType.Complete:
            setState((current) => ({
              ...current,
              table: new AttackDamageTable(data.result),
              runCountShown: current.runsRequested,
              runsFailed: data.result.runsFailed,
              isRunning: false,
            }));
            worker.terminate();
            break;
          case AttackDamageRunSetWorkerMessageType.Failed:
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
        characterSpecs: characterSpecs.map((spec) => spec.toSerialized()),
        runCount,
      });
    },
    []
  );

  return { state, run };
}

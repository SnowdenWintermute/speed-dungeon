import { AnalysisCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";
import { AttackDamageRunSet } from "./run-set";
import {
  AttackDamageRunSetWorkerMessage,
  AttackDamageRunSetWorkerMessageType,
  AttackDamageRunSetWorkerRequest,
} from "./run-set-worker-messages";

// the dom lib types the ambient `self` as a Window, whose postMessage takes `any` and would check
// nothing here. this is the part of a worker's global scope the file actually uses
declare const self: {
  onmessage: null | ((event: MessageEvent<AttackDamageRunSetWorkerRequest>) => void);
  postMessage: (message: AttackDamageRunSetWorkerMessage) => void;
};

function post(message: AttackDamageRunSetWorkerMessage) {
  self.postMessage(message);
}

self.onmessage = ({ data }) => {
  const runSet = new AttackDamageRunSet(
    data.characterSpecs.map(AnalysisCharacterSpecification.fromSerialized)
  );

  try {
    runSet.executeSet(data.runCount, (runsFinished) => {
      post({ type: AttackDamageRunSetWorkerMessageType.Progress, runsFinished });
    });

    post({ type: AttackDamageRunSetWorkerMessageType.Complete, result: runSet.result });
  } catch (error) {
    post({
      type: AttackDamageRunSetWorkerMessageType.Failed,
      reason: error instanceof Error ? error.message : String(error),
    });
  }
};

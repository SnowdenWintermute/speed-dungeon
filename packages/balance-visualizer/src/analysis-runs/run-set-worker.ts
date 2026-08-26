import { AnalysisCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";
import { attackDamageRunSet } from "@/studies/attack-damage/run-set";
import { maxAccuracyRunSet } from "@/studies/max-accuracy/run-set";
import { AnalysisRunSet } from "./run-set";
import {
  AnalysisRunSetWorkerMessage,
  AnalysisRunSetWorkerMessageType,
  AnalysisRunSetWorkerRequest,
} from "./run-set-worker-messages";
import { DungeonRunAnalysis, DungeonRunAnalysisResults } from "./types";

const RUN_SET_FACTORIES: {
  [AnalysisType in DungeonRunAnalysis]: (
    characterSpecs: AnalysisCharacterSpecification[]
  ) => AnalysisRunSet<DungeonRunAnalysisResults[AnalysisType]>;
} = {
  [DungeonRunAnalysis.AttackDamage]: attackDamageRunSet,
  [DungeonRunAnalysis.MaxAccuracy]: maxAccuracyRunSet,
};

// the dom lib types the ambient `self` as a Window, whose postMessage takes `any` and would check
// nothing here. this is the part of a worker's global scope the file actually uses
declare const self: {
  onmessage: null | ((event: MessageEvent<AnalysisRunSetWorkerRequest>) => void);
  postMessage: (message: AnalysisRunSetWorkerMessage<DungeonRunAnalysis>) => void;
};

function post(message: AnalysisRunSetWorkerMessage<DungeonRunAnalysis>) {
  self.postMessage(message);
}

self.onmessage = ({ data }) => {
  const runSet = RUN_SET_FACTORIES[data.analysis](
    data.characterSpecs.map(AnalysisCharacterSpecification.fromSerialized)
  );

  try {
    runSet.executeSet(data.runCount, (runsFinished) => {
      post({ type: AnalysisRunSetWorkerMessageType.Progress, runsFinished });
    });

    post({ type: AnalysisRunSetWorkerMessageType.Complete, result: runSet.result });
  } catch (error) {
    post({
      type: AnalysisRunSetWorkerMessageType.Failed,
      reason: error instanceof Error ? error.message : String(error),
    });
  }
};

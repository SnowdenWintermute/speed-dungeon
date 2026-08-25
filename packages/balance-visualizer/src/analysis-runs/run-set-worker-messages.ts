import { SerializedOf } from "@speed-dungeon/common";
import { AnalysisCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";
import { DungeonRunAnalysis, DungeonRunAnalysisResults } from "./dungeon-run-analysis";

/** the specs cross as data: postMessage would hand the worker the fields without the class */
export interface AnalysisRunSetWorkerRequest {
  analysis: DungeonRunAnalysis;
  characterSpecs: SerializedOf<AnalysisCharacterSpecification>[];
  runCount: number;
}

export enum AnalysisRunSetWorkerMessageType {
  Progress,
  Complete,
  Failed,
}

export type AnalysisRunSetWorkerMessage<AnalysisType extends DungeonRunAnalysis> =
  | { type: AnalysisRunSetWorkerMessageType.Progress; runsFinished: number }
  | {
      type: AnalysisRunSetWorkerMessageType.Complete;
      result: DungeonRunAnalysisResults[AnalysisType];
    }
  | { type: AnalysisRunSetWorkerMessageType.Failed; reason: string };

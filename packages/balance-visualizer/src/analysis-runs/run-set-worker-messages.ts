import { NormalizedPercentage, SerializedOf } from "@speed-dungeon/common";
import { AnalysisCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";
import { DungeonRunAnalysis, DungeonRunAnalysisResults } from "./types";

export interface AnalysisRunSetWorkerRequest {
  analysis: DungeonRunAnalysis;
  characterSpecs: SerializedOf<AnalysisCharacterSpecification>[];
  runCount: number;
  discretionaryShare: NormalizedPercentage;
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

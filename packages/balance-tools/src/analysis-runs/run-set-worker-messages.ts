import { NormalizedPercentage, SerializedOf } from "@speed-dungeon/common";
import { AnalysisCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";
import { AnalysisRunOptions } from "./analysis-run-options";
import { DungeonRunAnalysis } from "./dungeon-run-analysis";
import { DungeonRunAnalysisResults } from "./types";

/** everything the run controls decide, which is also everything the request adds a study to */
export interface AnalysisRunSetOptions extends AnalysisRunOptions {
  runCount: number;
  allocationIntensity: NormalizedPercentage;
}

export interface AnalysisRunSetWorkerRequest extends AnalysisRunSetOptions {
  analysis: DungeonRunAnalysis;
  characterSpecs: SerializedOf<AnalysisCharacterSpecification>[];
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

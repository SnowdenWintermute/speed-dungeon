import { NormalizedPercentage, SerializedOf } from "@speed-dungeon/common";
import { AnalysisCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";
import { DungeonRunAnalysis } from "./dungeon-run-analysis";
import { DungeonRunAnalysisResults } from "./types";

/** everything the run controls decide, which is also everything the request adds a study to */
export interface AnalysisRunOptions {
  runCount: number;
  allocationIntensity: NormalizedPercentage;
  /** off while deriving requirements, on to see how far having them moves the builds they gate */
  honorsEquipmentRequirements: boolean;
}

export interface AnalysisRunSetWorkerRequest extends AnalysisRunOptions {
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

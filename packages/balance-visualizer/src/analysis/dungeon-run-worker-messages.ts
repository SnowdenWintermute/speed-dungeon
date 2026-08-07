import { DungeonRunAnalysis, DungeonRunAnalysisResults } from "./dungeon-run-analysis";

export interface DungeonRunWorkerRequest {
  analysis: DungeonRunAnalysis;
  runCount: number;
}

export enum DungeonRunWorkerMessageType {
  Progress,
  Complete,
  Failed,
}

export type DungeonRunWorkerMessage<TAnalysis extends DungeonRunAnalysis = DungeonRunAnalysis> =
  | { type: DungeonRunWorkerMessageType.Progress; runsCompleted: number }
  | { type: DungeonRunWorkerMessageType.Complete; result: DungeonRunAnalysisResults[TAnalysis] }
  | { type: DungeonRunWorkerMessageType.Failed; reason: string };

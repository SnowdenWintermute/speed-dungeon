import { DungeonRunAnalysis, DungeonRunAnalysisResults } from "../dungeon-run-analysis";
import { PartyDrawSettings } from "../available-damage/party-draw";

export interface DungeonRunWorkerRequest {
  analysis: DungeonRunAnalysis;
  runCount: number;
  /** Only the damage analysis draws a party per run; the others fix theirs. */
  draw?: PartyDrawSettings;
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

import { RoomAccuracyAvailability } from "./accuracy-availability/index";

export enum DungeonRunAnalysis {
  AccuracyAvailability,
}

/** What each analysis assembles. Type-only, so naming an analysis from the main thread does not
 * pull the simulation into its bundle. */
export interface DungeonRunAnalysisResults {
  [DungeonRunAnalysis.AccuracyAvailability]: RoomAccuracyAvailability[];
}

export const DUNGEON_RUN_ANALYSIS_NAMES: Record<DungeonRunAnalysis, string> = {
  [DungeonRunAnalysis.AccuracyAvailability]: "Accuracy worn from loot",
};

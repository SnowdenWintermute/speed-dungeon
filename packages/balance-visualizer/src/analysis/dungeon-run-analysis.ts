import { RoomAccuracyAvailability } from "./accuracy-availability/index";
import { RoomComboSamples } from "./available-damage/index";

export enum DungeonRunAnalysis {
  AccuracyAvailability,
  AvailableDamage,
}

/** What each analysis assembles. Type-only, so naming an analysis from the main thread does not
 * pull the simulation into its bundle. */
export interface DungeonRunAnalysisResults {
  [DungeonRunAnalysis.AccuracyAvailability]: RoomAccuracyAvailability[];
  [DungeonRunAnalysis.AvailableDamage]: RoomComboSamples[];
}

export const DUNGEON_RUN_ANALYSIS_NAMES: Record<DungeonRunAnalysis, string> = {
  [DungeonRunAnalysis.AccuracyAvailability]: "Accuracy worn from loot",
  [DungeonRunAnalysis.AvailableDamage]: "Damage per turn by specialty",
};

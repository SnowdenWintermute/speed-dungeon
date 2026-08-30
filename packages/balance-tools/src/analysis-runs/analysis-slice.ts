import { CombatantClass } from "@speed-dungeon/common";
import { CharacterWeaponSpecialty } from "../analysis-subjects/character-weapon-specialty.ts";
import { AnalysisGoal } from "../goal-performance-checkers/analysis-goal.ts";

/** an omitted dimension means "any", so dropping one widens the slice without a re-run */
export interface AnalysisSlice {
  weaponSpecialty?: CharacterWeaponSpecialty;
  mainClass?: CombatantClass;
  supportClass?: CombatantClass | null;
  goal?: AnalysisGoal;
}

/** keyed by every dimension, so one added above without a reader here is a compile error rather
 * than two different slices quietly sharing a cache key */
const SLICE_DIMENSION_READERS: Record<
  keyof Required<AnalysisSlice>,
  (slice: AnalysisSlice) => unknown
> = {
  weaponSpecialty: (slice) => slice.weaponSpecialty,
  mainClass: (slice) => slice.mainClass,
  supportClass: (slice) => slice.supportClass,
  goal: (slice) => slice.goal,
};

const SLICE_DIMENSION_READERS_BY_NAME = Object.entries(SLICE_DIMENSION_READERS).sort(
  ([nameA], [nameB]) => nameA.localeCompare(nameB)
);

/** `String` rather than a bare join, since a support class of null means having none at all while
 * undefined means any — the two join to the same empty text */
export function sliceKey(slice: AnalysisSlice) {
  return SLICE_DIMENSION_READERS_BY_NAME.map(([, read]) => String(read(slice))).join("-");
}

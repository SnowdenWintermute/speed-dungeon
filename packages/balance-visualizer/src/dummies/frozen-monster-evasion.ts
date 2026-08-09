import { invariant } from "@speed-dungeon/common";
import { MonsterAttributeIntensity } from "../analysis/monster-attributes/monster-attribute-intensity";

/** Frozen 2026-08-07 from 500 ten-floor walks, party of Warrior/Rogue/Mage, solved for a 90% hit
 * rate against the reference character of each intensity (see REFERENCE_CHARACTER_PROFILES).
 *
 * Frozen deliberately. Everything downstream — damage per turn, turns to kill, the offence/defence
 * spread — needs monster evasion as a fixed input, or each study re-derives it from whatever
 * character it happens to be measuring and nothing can be compared across studies.
 *
 * Re-measure with print-monster-evasion when any of these change: the Dexterity to Accuracy ratio,
 * the affix templates or their tier values, class accuracy growth, drop rates, the XP curve or
 * level pacing, party size, or the equipment slot model in EquipmentPoolBySlot.
 */

/** Depth is the axis that resists a formula. A straight line through these misses by up to 2.3
 * because the party's level plateaus on floors 4 and 8 — that is the XP curve showing through, not
 * sampling noise, so the measured series is kept rather than smoothed. */
const MEDIUM_EVASION_BY_FLOOR: Record<number, number> = {
  1: 2.7,
  2: 11.7,
  3: 20.2,
  4: 24.6,
  5: 29.5,
  6: 39.6,
  7: 45.6,
  8: 51.1,
  9: 60.4,
  10: 67.1,
};

/** Intensity, unlike depth, is close to a clean scaling of the middle-of-the-road monster: the
 * measured ratio to Medium holds to within a few percent at every floor, so the other four rows
 * collapse into one multiplier each.
 *
 * Residuals against the 500-run measurement, floors 2-10: within ~3.5% for Low, High and VeryHigh.
 * VeryLow drifts further, over-predicting shallow floors and under-predicting deep ones by up to
 * ~7%, because it is the only profile with no support class and no allocation — its accuracy is
 * purely inherent, so it does not track loot the way the others do. Floor 1 is excluded from the
 * fit: every intensity is inside 7 evasion there and VeryLow clamps to 0, so evasion is not yet a
 * usable design lever that shallow. */
const EVASION_MULTIPLIER_BY_INTENSITY: Record<MonsterAttributeIntensity, number> = {
  [MonsterAttributeIntensity.VeryLow]: 0.37,
  [MonsterAttributeIntensity.Low]: 0.65,
  [MonsterAttributeIntensity.Medium]: 1,
  [MonsterAttributeIntensity.High]: 1.18,
  [MonsterAttributeIntensity.VeryHigh]: 1.92,
};

export function getFrozenMonsterEvasion(
  floorNumber: number,
  intensity: MonsterAttributeIntensity
): number {
  const mediumEvasion = MEDIUM_EVASION_BY_FLOOR[floorNumber];
  invariant(mediumEvasion !== undefined, `no frozen monster evasion for floor ${floorNumber}`);
  return mediumEvasion * EVASION_MULTIPLIER_BY_INTENSITY[intensity];
}

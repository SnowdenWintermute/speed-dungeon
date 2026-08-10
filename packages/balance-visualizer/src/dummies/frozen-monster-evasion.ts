import { invariant } from "@speed-dungeon/common";
import { MonsterAttributeIntensity } from "../analysis/monster-attributes/monster-attribute-intensity";
import { MONSTER_EVASION_BY_FLOOR } from "./monster-evasion.generated";

/** Frozen deliberately, and frozen is the point rather than an implementation detail. Everything
 * downstream — damage per turn, turns to kill, the offence/defence spread — needs monster evasion as
 * a fixed input. A study that derived it from whatever character it happened to be measuring would
 * move the target every time the measurement moved, and nothing could be compared across studies.
 *
 * Frozen does not mean permanent. The table is generated, and the header of the generated file lists
 * what invalidates it; re-derive with `yarn workspace @speed-dungeon/balance-visualizer
 * derive:evasion` and commit the result as its own change, so a shift in every downstream number has
 * a commit to point at. */
export function getFrozenMonsterEvasion(
  floorNumber: number,
  intensity: MonsterAttributeIntensity
): number {
  const byIntensity = MONSTER_EVASION_BY_FLOOR[floorNumber];
  invariant(byIntensity !== undefined, `no frozen monster evasion for floor ${floorNumber}`);
  return byIntensity[intensity];
}

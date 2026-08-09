import { NumberRange } from "@speed-dungeon/common";
import { MonsterAttributeIntensity } from "../analysis/monster-attributes/monster-attribute-intensity";
import { getFrozenMonsterEvasion } from "./frozen-monster-evasion";

export interface TrainingDummyProfile {
  accuracy: number;
  twoHandedDamage: NumberRange;
  oneHandedDamage: NumberRange;
  hitPoints: number;
  armorClass: number;
  evasion: number;
  agility: number;
  vitality: number;
}

/** Still guesses, every one of them. These get replaced attribute by attribute as the experiments
 * determine them — evasion was the first, and now comes from the frozen table rather than from the
 * growth curve below. Until an attribute is determined, treat any figure measured against it as
 * provisional: they are to be calibrated against the turns-to-die targets, an offense-optimized
 * character dying in ~3.5 turns and a defense-optimized one in ~9. Two-handed damage is
 * deliberately not 2x one-handed — a dual wielder trades armor penetration for higher throughput
 * and lower variance. */
const FLOOR_ONE = {
  accuracy: 75,
  twoHandedDamage: { min: 10, max: 20 },
  oneHandedDamage: { min: 8, max: 14 },
  hitPoints: 30,
  armorClass: 5,
  agility: 5,
  vitality: 5,
};

const PER_FLOOR_GROWTH = {
  accuracy: 2,
  hitPoints: 12,
  armorClass: 3,
  agility: 3,
  vitality: 3,
};

/** Multiplicative so the two-handed to one-handed ratio holds at every depth. Adding a flat amount
 * to both compresses it — two-handed was 1.36x one-handed on floor 1 but 1.18x on floor 10, handing
 * dual wielders a throughput lead that grew with depth. It also keeps the range width proportional,
 * so relative spikiness stays constant instead of flattening out. */
const DAMAGE_GROWTH_PER_FLOOR = 1.09;

export function getTrainingDummyProfile(
  floorNumber: number,
  evasionIntensity: MonsterAttributeIntensity
): TrainingDummyProfile {
  const floorsBelow = floorNumber - 1;
  const damageMultiplier = DAMAGE_GROWTH_PER_FLOOR ** floorsBelow;
  const scaleDamage = (bound: number) => Math.round(bound * damageMultiplier);

  return {
    accuracy: FLOOR_ONE.accuracy + PER_FLOOR_GROWTH.accuracy * floorsBelow,
    twoHandedDamage: new NumberRange(
      scaleDamage(FLOOR_ONE.twoHandedDamage.min),
      scaleDamage(FLOOR_ONE.twoHandedDamage.max)
    ),
    oneHandedDamage: new NumberRange(
      scaleDamage(FLOOR_ONE.oneHandedDamage.min),
      scaleDamage(FLOOR_ONE.oneHandedDamage.max)
    ),
    hitPoints: FLOOR_ONE.hitPoints + PER_FLOOR_GROWTH.hitPoints * floorsBelow,
    armorClass: FLOOR_ONE.armorClass + PER_FLOOR_GROWTH.armorClass * floorsBelow,
    evasion: getFrozenMonsterEvasion(floorNumber, evasionIntensity),
    agility: FLOOR_ONE.agility + PER_FLOOR_GROWTH.agility * floorsBelow,
    vitality: FLOOR_ONE.vitality + PER_FLOOR_GROWTH.vitality * floorsBelow,
  };
}

import { NumberRange } from "@speed-dungeon/common";

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

/** Placeholders, to be calibrated against the turns-to-die targets rather than guessed: an
 * offense-optimized character should die in ~3.5 turns and a defense-optimized one in ~9. Two-handed
 * damage is deliberately not 2x one-handed — a dual wielder trades armor penetration for higher
 * throughput and lower variance. */
const FLOOR_ONE = {
  accuracy: 75,
  twoHandedDamage: { min: 10, max: 20 },
  oneHandedDamage: { min: 8, max: 14 },
  hitPoints: 30,
  armorClass: 5,
  evasion: 10,
  agility: 5,
  vitality: 5,
};

const PER_FLOOR_GROWTH = {
  accuracy: 2,
  hitPoints: 12,
  armorClass: 3,
  evasion: 4,
  agility: 3,
  vitality: 3,
};

/** Multiplicative so the two-handed to one-handed ratio holds at every depth. Adding a flat amount
 * to both compresses it — two-handed was 1.36x one-handed on floor 1 but 1.18x on floor 10, handing
 * dual wielders a throughput lead that grew with depth. It also keeps the range width proportional,
 * so relative spikiness stays constant instead of flattening out. */
const DAMAGE_GROWTH_PER_FLOOR = 1.09;

export function getTrainingDummyProfile(floorNumber: number): TrainingDummyProfile {
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
    evasion: FLOOR_ONE.evasion + PER_FLOOR_GROWTH.evasion * floorsBelow,
    agility: FLOOR_ONE.agility + PER_FLOOR_GROWTH.agility * floorsBelow,
    vitality: FLOOR_ONE.vitality + PER_FLOOR_GROWTH.vitality * floorsBelow,
  };
}

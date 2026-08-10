// GENERATED FILE — do not edit by hand.
// Source: 500 simulated ten-floor walks, each intensity solved for a 90% hit
// rate against its reference character (see REFERENCE_CHARACTER_PROFILES).
// Regenerate with: yarn derive:evasion, or the button under the accuracy analysis in the app.
//
// Regenerate whenever any of these change: the Dexterity to Accuracy ratio, the affix templates or
// their tier values, class accuracy growth, drop rates, the XP curve or level pacing, party size, or
// the equipment slot model in EquipmentPoolBySlot.
import { MonsterAttributeIntensity } from "../analysis/monster-attributes/monster-attribute-intensity";

export const MONSTER_EVASION_BY_FLOOR: Record<
  number,
  Record<MonsterAttributeIntensity, number>
> = {
  1: {
    [MonsterAttributeIntensity.VeryLow]: 0.0,
    [MonsterAttributeIntensity.Low]: 0.0,
    [MonsterAttributeIntensity.Medium]: 0.0,
    [MonsterAttributeIntensity.High]: 0.5,
    [MonsterAttributeIntensity.VeryHigh]: 3.1,
  },
  2: {
    [MonsterAttributeIntensity.VeryLow]: 0.4,
    [MonsterAttributeIntensity.Low]: 3.4,
    [MonsterAttributeIntensity.Medium]: 6.7,
    [MonsterAttributeIntensity.High]: 8.4,
    [MonsterAttributeIntensity.VeryHigh]: 15.3,
  },
  3: {
    [MonsterAttributeIntensity.VeryLow]: 3.1,
    [MonsterAttributeIntensity.Low]: 8.0,
    [MonsterAttributeIntensity.Medium]: 13.1,
    [MonsterAttributeIntensity.High]: 15.6,
    [MonsterAttributeIntensity.VeryHigh]: 26.3,
  },
  4: {
    [MonsterAttributeIntensity.VeryLow]: 4.5,
    [MonsterAttributeIntensity.Low]: 10.2,
    [MonsterAttributeIntensity.Medium]: 16.4,
    [MonsterAttributeIntensity.High]: 19.6,
    [MonsterAttributeIntensity.VeryHigh]: 32.7,
  },
  5: {
    [MonsterAttributeIntensity.VeryLow]: 6.7,
    [MonsterAttributeIntensity.Low]: 12.3,
    [MonsterAttributeIntensity.Medium]: 20.1,
    [MonsterAttributeIntensity.High]: 24.0,
    [MonsterAttributeIntensity.VeryHigh]: 40.3,
  },
  6: {
    [MonsterAttributeIntensity.VeryLow]: 9.1,
    [MonsterAttributeIntensity.Low]: 17.6,
    [MonsterAttributeIntensity.Medium]: 27.8,
    [MonsterAttributeIntensity.High]: 32.9,
    [MonsterAttributeIntensity.VeryHigh]: 54.3,
  },
  7: {
    [MonsterAttributeIntensity.VeryLow]: 11.3,
    [MonsterAttributeIntensity.Low]: 20.2,
    [MonsterAttributeIntensity.Medium]: 32.4,
    [MonsterAttributeIntensity.High]: 38.6,
    [MonsterAttributeIntensity.VeryHigh]: 64.3,
  },
  8: {
    [MonsterAttributeIntensity.VeryLow]: 13.0,
    [MonsterAttributeIntensity.Low]: 22.4,
    [MonsterAttributeIntensity.Medium]: 36.6,
    [MonsterAttributeIntensity.High]: 43.7,
    [MonsterAttributeIntensity.VeryHigh]: 73.5,
  },
  9: {
    [MonsterAttributeIntensity.VeryLow]: 15.7,
    [MonsterAttributeIntensity.Low]: 27.0,
    [MonsterAttributeIntensity.Medium]: 43.7,
    [MonsterAttributeIntensity.High]: 52.0,
    [MonsterAttributeIntensity.VeryHigh]: 87.0,
  },
  10: {
    [MonsterAttributeIntensity.VeryLow]: 17.6,
    [MonsterAttributeIntensity.Low]: 29.0,
    [MonsterAttributeIntensity.Medium]: 48.9,
    [MonsterAttributeIntensity.High]: 58.8,
    [MonsterAttributeIntensity.VeryHigh]: 100.5,
  },
};

export const REFERENCE_ACCURACY_BY_FLOOR: Record<
  number,
  Record<MonsterAttributeIntensity, number>
> = {
  1: {
    [MonsterAttributeIntensity.VeryLow]: 86.9,
    [MonsterAttributeIntensity.Low]: 88.7,
    [MonsterAttributeIntensity.Medium]: 89.9,
    [MonsterAttributeIntensity.High]: 90.5,
    [MonsterAttributeIntensity.VeryHigh]: 93.1,
  },
  2: {
    [MonsterAttributeIntensity.VeryLow]: 90.4,
    [MonsterAttributeIntensity.Low]: 93.4,
    [MonsterAttributeIntensity.Medium]: 96.7,
    [MonsterAttributeIntensity.High]: 98.4,
    [MonsterAttributeIntensity.VeryHigh]: 105.3,
  },
  3: {
    [MonsterAttributeIntensity.VeryLow]: 93.1,
    [MonsterAttributeIntensity.Low]: 98.0,
    [MonsterAttributeIntensity.Medium]: 103.1,
    [MonsterAttributeIntensity.High]: 105.6,
    [MonsterAttributeIntensity.VeryHigh]: 116.3,
  },
  4: {
    [MonsterAttributeIntensity.VeryLow]: 94.5,
    [MonsterAttributeIntensity.Low]: 100.2,
    [MonsterAttributeIntensity.Medium]: 106.4,
    [MonsterAttributeIntensity.High]: 109.6,
    [MonsterAttributeIntensity.VeryHigh]: 122.7,
  },
  5: {
    [MonsterAttributeIntensity.VeryLow]: 96.7,
    [MonsterAttributeIntensity.Low]: 102.3,
    [MonsterAttributeIntensity.Medium]: 110.1,
    [MonsterAttributeIntensity.High]: 114.0,
    [MonsterAttributeIntensity.VeryHigh]: 130.3,
  },
  6: {
    [MonsterAttributeIntensity.VeryLow]: 99.1,
    [MonsterAttributeIntensity.Low]: 107.6,
    [MonsterAttributeIntensity.Medium]: 117.8,
    [MonsterAttributeIntensity.High]: 122.9,
    [MonsterAttributeIntensity.VeryHigh]: 144.3,
  },
  7: {
    [MonsterAttributeIntensity.VeryLow]: 101.3,
    [MonsterAttributeIntensity.Low]: 110.2,
    [MonsterAttributeIntensity.Medium]: 122.4,
    [MonsterAttributeIntensity.High]: 128.6,
    [MonsterAttributeIntensity.VeryHigh]: 154.3,
  },
  8: {
    [MonsterAttributeIntensity.VeryLow]: 103.0,
    [MonsterAttributeIntensity.Low]: 112.4,
    [MonsterAttributeIntensity.Medium]: 126.6,
    [MonsterAttributeIntensity.High]: 133.7,
    [MonsterAttributeIntensity.VeryHigh]: 163.5,
  },
  9: {
    [MonsterAttributeIntensity.VeryLow]: 105.7,
    [MonsterAttributeIntensity.Low]: 117.0,
    [MonsterAttributeIntensity.Medium]: 133.7,
    [MonsterAttributeIntensity.High]: 142.0,
    [MonsterAttributeIntensity.VeryHigh]: 177.0,
  },
  10: {
    [MonsterAttributeIntensity.VeryLow]: 107.6,
    [MonsterAttributeIntensity.Low]: 119.0,
    [MonsterAttributeIntensity.Medium]: 138.9,
    [MonsterAttributeIntensity.High]: 148.8,
    [MonsterAttributeIntensity.VeryHigh]: 190.5,
  },
};

import {
  DERIVED_ATTRIBUTE_AFFIX_RANGE_MULTIPLIER,
  FLAT_DAMAGE_AFFIX_RANGE_MULTIPLIER,
} from "@speed-dungeon/common";
import { DAMAGE_CHANNELS, DamageSources } from "../equipment-damage-sources";

export const POINTS_PER_BUDGET_UNIT: DamageSources = {
  strength: 1,
  dexterity: 1,
  accuracy: DERIVED_ATTRIBUTE_AFFIX_RANGE_MULTIPLIER,
  flatDamage: FLAT_DAMAGE_AFFIX_RANGE_MULTIPLIER,
};

export class GearBudget {
  private constructor(
    /** In budget units, to be divided among the channels however the solver likes. */
    readonly size: number,
    /** In points of each channel. A character cannot buy more accuracy than the accuracy that has
     * dropped*/
    readonly caps: DamageSources
  ) {}

  static from(availability: DamageSources, attackDamageIntensity: number): GearBudget {
    const totalSupply = DAMAGE_CHANNELS.reduce(
      (supply, channel) => supply + availability[channel] / POINTS_PER_BUDGET_UNIT[channel],
      0
    );

    return new GearBudget(attackDamageIntensity * totalSupply, availability);
  }
}

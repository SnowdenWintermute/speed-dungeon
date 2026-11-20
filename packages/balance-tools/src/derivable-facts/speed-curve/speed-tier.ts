import { CombatantClass, NormalizedPercentage } from "@speed-dungeon/common";
import { FULL_ALLOCATION_INTENSITY } from "../../analysis-runs/allocation-intensity.ts";
import {
  DESIGNED_AGILITY_INVESTMENT_PERCENTAGE,
  DESIGNED_AVERAGE_TO_SLOW_TURN_RATIO,
  DESIGNED_FAST_TO_SLOW_TURN_RATIO,
  DESIGNED_FULLY_ALLOCATED_TO_SLOW_TURN_RATIO,
  FAST_AGILITY_INVESTMENT_PERCENTAGE,
} from "../../tuning-consts.ts";

/** each is weighed against the slow tier, which allocates nothing and wears no agility gear */
export enum SpeedTier {
  Average,
  Fast,
  FullyAllocated,
}

export const SPEED_TIERS = [SpeedTier.Average, SpeedTier.Fast, SpeedTier.FullyAllocated];

export interface SpeedTierConfig {
  label: string;
  intensity: NormalizedPercentage;
  /** whose median agility the tier reads from the run at its intensity */
  mainClasses: CombatantClass[];
  targetTurnRatio: number;
}

export const SPEED_TIER_CONFIGS: Record<SpeedTier, SpeedTierConfig> = {
  [SpeedTier.Average]: {
    label: "avg",
    intensity: DESIGNED_AGILITY_INVESTMENT_PERCENTAGE,
    mainClasses: [CombatantClass.Warrior, CombatantClass.Mage],
    targetTurnRatio: DESIGNED_AVERAGE_TO_SLOW_TURN_RATIO,
  },
  [SpeedTier.Fast]: {
    label: "fast",
    intensity: FAST_AGILITY_INVESTMENT_PERCENTAGE,
    mainClasses: [CombatantClass.Rogue],
    targetTurnRatio: DESIGNED_FAST_TO_SLOW_TURN_RATIO,
  },
  [SpeedTier.FullyAllocated]: {
    label: "full",
    intensity: FULL_ALLOCATION_INTENSITY,
    mainClasses: [CombatantClass.Rogue],
    targetTurnRatio: DESIGNED_FULLY_ALLOCATED_TO_SLOW_TURN_RATIO,
  },
};

/** the classes with the least inherent agility, of which the slow tier is the slower */
export const SLOW_TIER_MAIN_CLASSES = [CombatantClass.Warrior, CombatantClass.Mage];

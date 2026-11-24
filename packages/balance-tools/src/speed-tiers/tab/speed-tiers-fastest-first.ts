import { iterateNumericEnum, SpeedTier } from "@speed-dungeon/common";

export const SPEED_TIERS_FASTEST_FIRST = iterateNumericEnum(SpeedTier).reverse();

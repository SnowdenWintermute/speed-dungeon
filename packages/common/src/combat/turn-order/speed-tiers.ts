export enum SpeedTier {
  Slowest,
  Slower,
  Slow,
  Average,
  Fast,
  Faster,
  Fastest,
}

export const SPEED_TIER_STRINGS: Record<SpeedTier, string> = {
  [SpeedTier.Slowest]: "Slowest",
  [SpeedTier.Slower]: "Slower",
  [SpeedTier.Slow]: "Slow",
  [SpeedTier.Average]: "Average",
  [SpeedTier.Fast]: "Fast",
  [SpeedTier.Faster]: "Faster",
  [SpeedTier.Fastest]: "Fastest",
};

const SPEED_TIER_RATIO_ANCHORS = {
  AVERAGE_TO_SLOW: 5 / 4,
  AVERAGE_TO_SLOWER: 4 / 3,
  AVERAGE_TO_SLOWEST: 3 / 2,
};

const AVERAGE_SPEED_TIER_BASE_TURN_DELAY = 1200;

export const SPEED_TIER_BASE_DELAY_RATES: Record<SpeedTier, number> = {
  [SpeedTier.Slowest]: Math.round(
    AVERAGE_SPEED_TIER_BASE_TURN_DELAY * SPEED_TIER_RATIO_ANCHORS.AVERAGE_TO_SLOWEST
  ),
  [SpeedTier.Slower]: Math.round(
    AVERAGE_SPEED_TIER_BASE_TURN_DELAY * SPEED_TIER_RATIO_ANCHORS.AVERAGE_TO_SLOWER
  ),
  [SpeedTier.Slow]: Math.round(
    AVERAGE_SPEED_TIER_BASE_TURN_DELAY * SPEED_TIER_RATIO_ANCHORS.AVERAGE_TO_SLOW
  ),
  [SpeedTier.Average]: AVERAGE_SPEED_TIER_BASE_TURN_DELAY,
  [SpeedTier.Fast]: Math.round(
    AVERAGE_SPEED_TIER_BASE_TURN_DELAY / SPEED_TIER_RATIO_ANCHORS.AVERAGE_TO_SLOW
  ),
  [SpeedTier.Faster]: Math.round(
    AVERAGE_SPEED_TIER_BASE_TURN_DELAY / SPEED_TIER_RATIO_ANCHORS.AVERAGE_TO_SLOWER
  ),
  [SpeedTier.Fastest]: Math.round(
    AVERAGE_SPEED_TIER_BASE_TURN_DELAY / SPEED_TIER_RATIO_ANCHORS.AVERAGE_TO_SLOWEST
  ),
};

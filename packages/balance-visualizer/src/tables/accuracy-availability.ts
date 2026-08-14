import { AffixType, NormalizedPercentage } from "@speed-dungeon/common";

// by room, for avg character
export interface AccuracyTable {
  inherentDex: number;
  allocatedDex: number;
  // available accuracy total
  aggregatedTotalAvailableAccuracy: {
    tenthPercentileAverage: number;
    median: number;
    ninetiethPercentileAverage: number;
  };
  // get max total acc that could fill all slots on interested characters
  // divide by interested character count
  // includes +dex and +acc affixes
  aggregatedAvailableAccuracyFromEquipment: {
    tenthPercentileAverage: number;
    median: {
      total: number;
      affixSplit: {
        [AffixType.Dexterity]: NormalizedPercentage;
        [AffixType.Accuracy]: NormalizedPercentage;
      };
    };
    ninetiethPercentileAverage: number;
  };
}

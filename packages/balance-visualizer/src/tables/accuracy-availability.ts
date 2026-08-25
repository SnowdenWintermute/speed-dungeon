import { AffixType, NormalizedPercentage } from "@speed-dungeon/common";
import { Distribution } from "@/statistics/distribution";

// by room, for avg character
export interface AccuracyTable {
  inherentDex: number;
  allocatedDex: number;
  totalAvailableAccuracy: Distribution;
  // get max total acc that could fill all slots on interested characters
  // divide by interested character count
  // includes +dex and +acc affixes
  availableAccuracyFromEquipment: Distribution;
  // of the median available accuracy from equipment, how much each affix contributed
  medianAccuracyFromEquipmentAffixSplit: {
    [AffixType.Dexterity]: NormalizedPercentage;
    [AffixType.Accuracy]: NormalizedPercentage;
  };
}

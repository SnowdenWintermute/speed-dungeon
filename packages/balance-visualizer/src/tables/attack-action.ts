import { AffixType, CombatAttribute, Equipment, NormalizedPercentage } from "@speed-dungeon/common";
import { DataTableColumn } from "@speed-dungeon/ui/atoms/DataTable/column";

// all rows are for one AnalysisCharacterSpecification
// or could be averages of all AnalysisCharacterSpecification
// one row per room
export interface AttackActionAnalysisTableEntry {
  floor: number;
  roomOnFloor: number;
  // sampled from some defined constant of attacks on a target dummy
  // across all runs
  aggregatedDamage: {
    tenthPercentileAverage: number;
    median: number;
    ninetiethPercentileAverage: number;
  };
  averageAffixValuesTotaledFromWornEquipment: {
    [AffixType.Dexterity]: number;
    [AffixType.Strength]: number;
    [AffixType.Accuracy]: number;
    [AffixType.FlatDamage]: number; // do not include weapon
  };
  averageAttributePointAllocations: {
    [CombatAttribute.Strength]: number;
    [CombatAttribute.Dexterity]: number;
  };
  weaponHasFlatDamageAffix: NormalizedPercentage;
  // totals over inherent, worn equipment, and point allocations
  averageTotalContributingCoreAttributes: {
    [CombatAttribute.Strength]: number;
    [CombatAttribute.Dexterity]: number;
  };
  holdablesAvailablityPercentages: EquipmentAndPercent[];
  holdablesWornPercentages: {
    mainHand: EquipmentAndPercent;
    offhand: EquipmentAndPercent;
  };
}

export interface EquipmentAndPercent {
  holdable: Equipment;
  percentOfRunsAvailable: NormalizedPercentage;
}

export const ATTACK_ACTION_ANALYSIS_COLUMNS: DataTableColumn<AttackActionAnalysisTableEntry>[] = [
  { header: "Floor", renderCell: (entry) => entry.floor },
  { header: "Room", renderCell: (entry) => entry.roomOnFloor },
];

import { AffixType, CombatAttribute, Equipment, NormalizedPercentage } from "@speed-dungeon/common";
import { DataTableColumn } from "@speed-dungeon/ui/atoms/DataTable/column";

// one row per room
export interface AttackActionAnalysisTableEntry {
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

// export const ATTACK_ACTION_ANALYSIS_COLUMNS: DataTableColumn<ExperiencePointsLadderViewEntry>[] =
//   [
//     { header: "Rank", widthPercentOption: 8, renderCell: (entry) => entry.rank },
//     {
//       header: "Character",
//       renderCell: (entry) => (
//         <LadderTableCellLink href={progressionCharacterRoute(entry.characterId)}>
//           {entry.characterName}
//         </LadderTableCellLink>
//       ),
//     },
//     {
//       header: "Owner",
//       renderCell: (entry) => (
//         <LadderTableCellLink href={playerProfileRoute(entry.ownerUsername)}>
//           {entry.ownerUsername}
//         </LadderTableCellLink>
//       ),
//     },
//     {
//       header: "Main Class",
//       renderCell: (entry) => classProgressText(entry.mainClass),
//     },
//     {
//       header: "Support Class",
//       renderCell: (entry) => supportClassText(entry.supportClassOption),
//     },
//     {
//       header: "Experience",
//       renderCell: (entry) => entry.totalExperiencePoints.toLocaleString(),
//     },
//   ];

// export function experiencePointsLadderEntryKey(entry: ExperiencePointsLadderViewEntry): string {
//   return entry.characterId;
// }

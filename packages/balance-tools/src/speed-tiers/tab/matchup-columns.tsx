import { SPEED_TIER_BASE_DELAY_RATES, SPEED_TIER_STRINGS, SpeedTier } from "@speed-dungeon/common";
import { DataTableColumn } from "@speed-dungeon/ui/atoms/DataTable/column";
import { SpeedTierMatchup } from "../speed-tier-matchup.ts";
import { SPEED_TIERS_FASTEST_FIRST } from "./speed-tiers-fastest-first.ts";

export const MATCHUP_COLUMNS: DataTableColumn<SpeedTier>[] = [
  { header: "Tier", renderCell: (rowTier) => SPEED_TIER_STRINGS[rowTier] },
  ...SPEED_TIERS_FASTEST_FIRST.map((columnTier) => ({
    header: `vs ${SPEED_TIER_STRINGS[columnTier]}`,
    renderCell: (rowTier: SpeedTier) =>
      new SpeedTierMatchup(
        SPEED_TIER_BASE_DELAY_RATES[rowTier],
        SPEED_TIER_BASE_DELAY_RATES[columnTier]
      ).describe(),
  })),
];

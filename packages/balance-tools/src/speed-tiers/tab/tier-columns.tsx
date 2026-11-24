import { SPEED_TIER_BASE_DELAY_RATES, SPEED_TIER_STRINGS, SpeedTier } from "@speed-dungeon/common";
import { DataTableColumn } from "@speed-dungeon/ui/atoms/DataTable/column";
import { formatTurnRatio } from "../format-turn-ratio.ts";

export const SPEED_TIER_COLUMNS: DataTableColumn<SpeedTier>[] = [
  { header: "Tier", renderCell: (tier) => SPEED_TIER_STRINGS[tier] },
  { header: "Delay", renderCell: (tier) => SPEED_TIER_BASE_DELAY_RATES[tier] },
  {
    header: "Turns per Average turn",
    renderCell: (tier) =>
      formatTurnRatio(
        SPEED_TIER_BASE_DELAY_RATES[SpeedTier.Average] / SPEED_TIER_BASE_DELAY_RATES[tier]
      ),
  },
];

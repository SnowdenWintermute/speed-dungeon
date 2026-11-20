import { DataTableColumn } from "@speed-dungeon/ui/atoms/DataTable/column";
import {
  SpeedCurveFit,
  SpeedCurveSearch,
  SpeedTierRoom,
} from "../../../derivable-facts/speed-curve/speed-curve-search.ts";
import {
  SPEED_TIER_CONFIGS,
  SPEED_TIERS,
  SpeedTier,
} from "../../../derivable-facts/speed-curve/speed-tier.ts";

function tierColumns(tier: SpeedTier, fit: SpeedCurveFit): DataTableColumn<SpeedTierRoom>[] {
  const { label, targetTurnRatio } = SPEED_TIER_CONFIGS[tier];
  return [
    { header: `${label} agi`, renderCell: (room) => Math.floor(room.agilityByTier[tier]) },
    {
      header: `${label} ratio`,
      renderCell: (room) => (
        <span className="whitespace-nowrap">
          {SpeedCurveSearch.turnRatio(
            fit.agilityBase,
            fit.exponent,
            room.agilityByTier[tier],
            room.slowAgility
          ).toFixed(2)}
          <span className="text-theme-muted"> / {targetTurnRatio}</span>
        </span>
      ),
    },
  ];
}

export function speedCurveColumns(fit: SpeedCurveFit): DataTableColumn<SpeedTierRoom>[] {
  return [
    { header: "Room", renderCell: (room) => `${room.floor}-${room.room}` },
    { header: "lvl", renderCell: (room) => room.level },
    { header: "slow agi", renderCell: (room) => room.slowAgility },
    ...SPEED_TIERS.flatMap((tier) => tierColumns(tier, fit)),
  ];
}

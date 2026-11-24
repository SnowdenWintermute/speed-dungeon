import { SPEED_TIER_STRINGS } from "@speed-dungeon/common";
import { DataTable } from "@speed-dungeon/ui/atoms/DataTable";
import { DataTableLayout } from "@speed-dungeon/ui/atoms/DataTable/column";
import { MATCHUP_COLUMNS } from "./matchup-columns.tsx";
import { SPEED_TIER_COLUMNS } from "./tier-columns.tsx";
import { SPEED_TIERS_FASTEST_FIRST } from "./speed-tiers-fastest-first.ts";

export function SpeedTiersTab() {
  return (
    <div>
      <h2 className="text-lg mb-2">Tiers</h2>
      <div className="mb-6 bg-theme-base p-2 border border-theme-muted overflow-auto">
        <DataTable
          columns={SPEED_TIER_COLUMNS}
          entries={SPEED_TIERS_FASTEST_FIRST}
          keyOf={(tier) => SPEED_TIER_STRINGS[tier]}
          emptyMessage="no speed tiers"
          layoutOption={DataTableLayout.FitContent}
        />
      </div>

      <h2 className="text-lg mb-2">Turns, row tier : column tier</h2>
      <div className="mb-2 bg-theme-base p-2 border border-theme-muted overflow-auto">
        <DataTable
          columns={MATCHUP_COLUMNS}
          entries={SPEED_TIERS_FASTEST_FIRST}
          keyOf={(tier) => SPEED_TIER_STRINGS[tier]}
          emptyMessage="no speed tiers"
          layoutOption={DataTableLayout.FitContent}
        />
      </div>
      <p className="text-sm text-theme-muted">
        * the row tier&apos;s first back-to-back turns, with both starting one turn in, no initiative
        roll, and the faster tier winning ties
      </p>
    </div>
  );
}

import { useState } from "react";
import { HotkeyButton } from "@speed-dungeon/ui/atoms/HotkeyButton";
import NumberInput from "@speed-dungeon/ui/atoms/NumberInput";
import { DataTable } from "@speed-dungeon/ui/atoms/DataTable";
import { DataTableLayout } from "@speed-dungeon/ui/atoms/DataTable/column";
import { AttackDamageRunSet } from "@/analysis-runs/attack-damage/report-aggregator";
import { DEFAULT_ANALYSIS_CHARACTER_SPECS } from "@/analysis-runs/attack-damage";
import {
  ATTACK_DAMAGE_TABLE_COLUMNS,
  AttackDamageSlice,
  AttackDamageTable,
} from "@/tables/attack-action";
import { AttackDamageSliceControls } from "./AttackDamageSliceControls";

const DEFAULT_RUN_COUNT = "10";
const INPUT_CLASSES = "h-10 w-24 bg-theme-base border border-theme-muted pl-2";

export function AttackDamagePanel() {
  const [runCount, setRunCount] = useState(DEFAULT_RUN_COUNT);
  const [table, setTable] = useState<AttackDamageTable | null>(null);
  const [slice, setSlice] = useState<AttackDamageSlice>({});
  const [isRunning, setIsRunning] = useState(false);

  function executeSet() {
    setIsRunning(true);
    const runSet = new AttackDamageRunSet(DEFAULT_ANALYSIS_CHARACTER_SPECS);
    runSet.executeSet(Number(runCount));
    setTable(new AttackDamageTable(runSet.samples));
    setIsRunning(false);
  }

  const rows = table === null ? [] : table.selectRows(slice);

  return (
    <div>
      <div className="mb-4 flex items-end gap-2">
        <label className="flex flex-col">
          <span className="text-theme-muted">Runs</span>
          <NumberInput
            name="runs"
            className={INPUT_CLASSES + " p-4"}
            min={1}
            value={runCount}
            onChange={setRunCount}
            onEnter={executeSet}
          />
        </label>
        <HotkeyButton onClick={executeSet} disabled={isRunning || runCount === ""}>
          {isRunning ? "running..." : "run set"}
        </HotkeyButton>
      </div>

      <AttackDamageSliceControls slice={slice} onChange={setSlice} />

      <DataTable
        columns={ATTACK_DAMAGE_TABLE_COLUMNS}
        entries={rows}
        keyOf={(row) => `${row.floor}-${row.room}`}
        emptyMessage={table === null ? "no runs yet" : "no samples match this slice"}
        layoutOption={DataTableLayout.FitContent}
      />
    </div>
  );
}

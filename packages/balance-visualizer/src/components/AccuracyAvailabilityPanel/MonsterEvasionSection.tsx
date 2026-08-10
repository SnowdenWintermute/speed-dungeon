import { useMemo } from "react";
import { DataTable } from "@speed-dungeon/ui/atoms/DataTable";
import { MONSTER_EVASION_COLUMNS, floorKey } from "./monster-evasion-columns";
import { MonsterEvasionTargets } from "@/analysis/monster-attributes/monster-evasion-targets";
import { RoomAccuracyAvailability } from "@/analysis/accuracy-availability/index";
import { FreezeEvasionTableButton } from "./FreezeEvasionTableButton";

export function MonsterEvasionSection({
  rooms,
  runCount,
}: {
  rooms: RoomAccuracyAvailability[];
  runCount: number;
}) {
  const floors = useMemo(() => MonsterEvasionTargets.byFloor(rooms), [rooms]);

  return (
    <section>
      <h2 className="text-xl mb-2">Monster evasion by floor</h2>
      <FreezeEvasionTableButton floors={floors} runCount={runCount} />
      <div className="bg-theme-base border p-2 px-4 border-theme-muted mx-auto">
        <DataTable
          columns={MONSTER_EVASION_COLUMNS}
          entries={floors}
          keyOf={floorKey}
          emptyMessage="no floors walked"
        />
      </div>
    </section>
  );
}

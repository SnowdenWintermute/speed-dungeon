import { useMemo } from "react";
import { DataTable } from "@speed-dungeon/ui/atoms/DataTable";
import { RoomAccuracyAvailability } from "@/analysis/accuracy-availability";
import { MonsterEvasionTargets } from "@/analysis/monster-evasion-targets";
import { MONSTER_EVASION_COLUMNS, floorKey } from "./monster-evasion-columns";

export function MonsterEvasionSection({ rooms }: { rooms: RoomAccuracyAvailability[] }) {
  const floors = useMemo(() => MonsterEvasionTargets.byFloor(rooms), [rooms]);

  return (
    <section>
      <h2 className="text-xl mb-2">Monster evasion by floor</h2>
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

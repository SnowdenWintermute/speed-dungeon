import { useState } from "react";
import ButtonBasic from "@speed-dungeon/ui/atoms/ButtonBasic";
import { FloorEvasionTargets } from "@/analysis/monster-attributes/monster-evasion-targets";
import { renderMonsterEvasionModule } from "@/analysis/monster-attributes/emit-monster-evasion-module";
import { WRITE_GENERATED_EVASION_ROUTE } from "@/analysis/monster-attributes/generated-evasion-route";

enum WriteStatus {
  Idle,
  Writing,
  Wrote,
  Failed,
}

/** Freezes the walk currently on screen as the evasion table every other study measures against.
 *
 * The table is a deliberate constant, so this is not a thing to press casually — every damage figure
 * downstream moves with it. The run count is shown on the button for that reason: a table frozen
 * from a handful of runs is one where each cell rests on a handful of that floor's rooms.
 *
 * Writing a source file needs the dev server's middleware, which exists only under `vite dev`. The
 * button renders nowhere else rather than appearing and failing on a route nobody serves. */
export function FreezeEvasionTableButton({
  floors,
  runCount,
}: {
  floors: FloorEvasionTargets[];
  runCount: number;
}) {
  const [status, setStatus] = useState(WriteStatus.Idle);
  const [message, setMessage] = useState("");

  if (!import.meta.env.DEV) {
    return null;
  }

  async function write() {
    setStatus(WriteStatus.Writing);

    const response = await fetch(WRITE_GENERATED_EVASION_ROUTE, {
      method: "POST",
      body: renderMonsterEvasionModule(floors, runCount),
    });
    const body = await response.text();

    setStatus(response.ok ? WriteStatus.Wrote : WriteStatus.Failed);
    setMessage(body);
  }

  return (
    <div className="flex items-center mb-2">
      <ButtonBasic onClick={write} disabled={status === WriteStatus.Writing}>
        {`Freeze this table from ${runCount} runs`}
      </ButtonBasic>
      {status === WriteStatus.Wrote && (
        <span className="text-sm text-theme-muted ml-2">{`wrote ${message}`}</span>
      )}
      {status === WriteStatus.Failed && (
        <span className="text-sm text-theme-danger ml-2">{message}</span>
      )}
    </div>
  );
}

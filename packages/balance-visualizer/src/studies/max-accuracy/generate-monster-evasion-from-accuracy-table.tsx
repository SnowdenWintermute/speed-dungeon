import { useState } from "react";
import ButtonBasic from "@speed-dungeon/ui/atoms/ButtonBasic";
import { writeGeneratedFile } from "@/write-generated-file";
import { determinePerFloorMonsterEvasion } from "./determine-per-floor-monster-evasion";
import {
  emitMonsterEvasionModule,
  GENERATED_MONSTER_EVASION_MODULE_PATH,
} from "./emit-monster-evasion-module";
import { MaxAccuracyTable } from "./table";

interface Props {
  table: MaxAccuracyTable;
}

export function GenerateMonsterEvasionFromAccuracyTable({ table }: Props) {
  const [outcome, setOutcome] = useState<null | string>(null);
  const [failureReason, setFailureReason] = useState<null | string>(null);

  if (!import.meta.env.DEV) {
    return null;
  }

  async function handleGenerate() {
    setOutcome(null);
    setFailureReason(null);

    try {
      const evasionByFloor = determinePerFloorMonsterEvasion(table);
      const contents = emitMonsterEvasionModule(evasionByFloor);
      setOutcome(await writeGeneratedFile(GENERATED_MONSTER_EVASION_MODULE_PATH, contents));
    } catch (probablyError) {
      setFailureReason(
        probablyError instanceof Error ? probablyError.message : String(probablyError)
      );
    }
  }

  return (
    <div className="flex items-center gap-4">
      <ButtonBasic onClick={handleGenerate} disabled={false} extraStyles="bg-theme-recessed">
        generate monster evasion
      </ButtonBasic>

      {outcome !== null && (
        <span className="text-sm text-theme-muted">
          wrote {outcome} (must refresh to source the generated file)
        </span>
      )}
      {failureReason !== null && <span className="text-sm text-theme-danger">{failureReason}</span>}
    </div>
  );
}

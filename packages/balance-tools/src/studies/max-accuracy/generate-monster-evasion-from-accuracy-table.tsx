import { WriteFileButton } from "../../components/write-file-button.tsx";
import { determinePerFloorMonsterEvasion } from "../../derivable-facts/determine-monster-evasion-per-floor.ts";
import { writeGeneratedFile } from "../../write-generated-file.ts";
import {
  emitMonsterEvasionModule,
  GENERATED_MONSTER_EVASION_MODULE_PATH,
} from "./emit-monster-evasion-module.ts";
import { MaxAccuracyTable } from "./table.ts";

interface Props {
  table: MaxAccuracyTable;
}

export function GenerateMonsterEvasionFromAccuracyTable({ table }: Props) {
  return (
    <WriteFileButton
      label="generate monster evasion"
      disabled={false}
      noteAfterWrite="must refresh to source the generated file"
      write={() =>
        writeGeneratedFile(
          GENERATED_MONSTER_EVASION_MODULE_PATH,
          emitMonsterEvasionModule(determinePerFloorMonsterEvasion(table))
        )
      }
    />
  );
}

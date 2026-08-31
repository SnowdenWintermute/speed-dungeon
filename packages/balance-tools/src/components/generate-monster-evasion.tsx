import { determinePerFloorMonsterEvasion } from "../derivable-facts/determine-monster-evasion-per-floor.ts";
import {
  emitMonsterEvasionModule,
  GENERATED_MONSTER_EVASION_MODULE_PATH,
} from "../derivable-facts/emit-monster-evasion-module.ts";
import { MaxAccuracyTable } from "../studies/max-accuracy/table.ts";
import { writeGeneratedFile } from "../write-generated-file.ts";
import { WriteFileButton } from "./write-file-button.tsx";

interface Props {
  table: MaxAccuracyTable;
}

export function GenerateMonsterEvasion({ table }: Props) {
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

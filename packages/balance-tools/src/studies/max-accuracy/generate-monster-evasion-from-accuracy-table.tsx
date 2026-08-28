import { WriteFileButton } from "@/components/write-file-button";
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

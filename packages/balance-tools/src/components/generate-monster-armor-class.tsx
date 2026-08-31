import { determinePerFloorMonsterArmorClass } from "../derivable-facts/determine-monster-armor-class-per-floor.ts";
import {
  emitMonsterArmorClassModule,
  GENERATED_MONSTER_ARMOR_CLASS_MODULE_PATH,
} from "../derivable-facts/emit-monster-armor-class-module.ts";
import { SampledDamageTable } from "../studies/sampled-damage/table.ts";
import { writeGeneratedFile } from "../write-generated-file.ts";
import { WriteFileButton } from "./write-file-button.tsx";

interface Props {
  table: SampledDamageTable;
}

export function GenerateMonsterArmorClass({ table }: Props) {
  return (
    <WriteFileButton
      label="generate monster armor class"
      disabled={false}
      noteAfterWrite="must refresh to source the generated file"
      write={() =>
        writeGeneratedFile(
          GENERATED_MONSTER_ARMOR_CLASS_MODULE_PATH,
          emitMonsterArmorClassModule(determinePerFloorMonsterArmorClass(table))
        )
      }
    />
  );
}

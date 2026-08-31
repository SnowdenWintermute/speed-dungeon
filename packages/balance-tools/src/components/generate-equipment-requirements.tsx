import {
  emitEquipmentRequirementsModule,
  generatedRequirementsModulePath,
} from "../derivable-facts/equipment-requirements/emit-module.ts";
import { generateEquipmentRequirements } from "../derivable-facts/equipment-requirements/equipment-requirements-generator.ts";
import { StudyName } from "../studies/study-name.ts";
import { writeGeneratedFile } from "../write-generated-file.ts";
import { WriteFileButton } from "./write-file-button.tsx";
import { SampledDamageTable } from "../studies/sampled-damage/table.ts";
import { EQUIPMENT_REQUIREMENT_TARGETS } from "../derivable-facts/equipment-requirements/requirement-targets.generated.ts";

interface Props {
  studyName: StudyName;
  table: SampledDamageTable;
}

export function GenerateEquipmentRequirements({ studyName, table }: Props) {
  const targets = EQUIPMENT_REQUIREMENT_TARGETS.filter((target) => target.studyName === studyName);

  return (
    <WriteFileButton
      label={`generate equipment requirements (${targets.length} targets)`}
      disabled={targets.length === 0}
      noteAfterWrite="must refresh to source the generated file"
      write={() =>
        writeGeneratedFile(
          generatedRequirementsModulePath(studyName),
          emitEquipmentRequirementsModule(studyName, generateEquipmentRequirements(table, targets))
        )
      }
    />
  );
}

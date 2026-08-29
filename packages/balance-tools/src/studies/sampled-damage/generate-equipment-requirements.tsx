import { WriteFileButton } from "../../components/write-file-button.tsx";
import { writeGeneratedFile } from "../../write-generated-file.ts";
import {
  emitEquipmentRequirementsModule,
  generatedRequirementsModulePath,
} from "../emit-equipment-requirements-module.ts";
import { generateEquipmentRequirements } from "../equipment-requirements-generator.ts";
import { EQUIPMENT_REQUIREMENT_TARGETS } from "../requirement-targets.generated.ts";
import { StudyName } from "../study-name.ts";
import { SampledDamageTable } from "./table.ts";

interface Props {
  studyName: StudyName;
  table: SampledDamageTable;
}

export function GenerateEquipmentRequirements({ studyName, table }: Props) {
  const targets = EQUIPMENT_REQUIREMENT_TARGETS.filter(
    (target) => target.studyName === studyName
  );

  return (
    <WriteFileButton
      label={`generate equipment requirements (${targets.length} targets)`}
      disabled={targets.length === 0}
      noteAfterWrite="must refresh to source the generated file"
      write={() =>
        writeGeneratedFile(
          generatedRequirementsModulePath(studyName),
          emitEquipmentRequirementsModule(
            studyName,
            generateEquipmentRequirements(table, targets)
          )
        )
      }
    />
  );
}

import { WriteFileButton } from "@/components/write-file-button";
import { writeGeneratedFile } from "@/write-generated-file";
import {
  emitEquipmentRequirementsModule,
  generatedRequirementsModulePath,
} from "@/studies/emit-equipment-requirements-module";
import { generateEquipmentRequirements } from "@/studies/equipment-requirements-generator";
import { EQUIPMENT_REQUIREMENT_TARGETS } from "@/studies/requirement-targets.generated";
import { StudyName } from "@/studies/study-name";
import { AttackDamageTable } from "./table";

interface Props {
  studyName: StudyName;
  table: AttackDamageTable;
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

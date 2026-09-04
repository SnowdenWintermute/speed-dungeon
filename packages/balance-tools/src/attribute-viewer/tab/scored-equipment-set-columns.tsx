import {
  AFFIX_TYPE_STRINGS,
  COMBAT_ATTRIBUTE_STRINGS,
  Equipment,
  EQUIPMENT_SLOT_ID_STRINGS,
  EquipmentSlotId,
  iterateNumericEnum,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { DataTableCellLayout, DataTableColumn } from "@speed-dungeon/ui/atoms/DataTable/column";
import { AttributeRequirementThreshold } from "../attribute-requirement-threshold";
import { ScoredEquipmentSet } from "../threshold-equipment-set-scores";

const NOTHING = "—";

function describeRequirements(requirements: AttributeRequirementThreshold) {
  const described = iterateNumericEnumKeyedRecord(requirements.getMinimums()).map(
    ([attribute, minimum]) => `${COMBAT_ATTRIBUTE_STRINGS[attribute]} ${minimum}`
  );

  return described.length === 0 ? NOTHING : described.join(", ");
}

function describeAffixes(equipment: Equipment) {
  const described = iterateNumericEnumKeyedRecord(equipment.affixes).flatMap(([, affixes]) =>
    iterateNumericEnumKeyedRecord(affixes).map(
      ([affixType, affix]) => `${AFFIX_TYPE_STRINGS[affixType]} t${affix.tier}`
    )
  );

  return described.join(", ");
}

function slotColumn(slotId: EquipmentSlotId): DataTableColumn<ScoredEquipmentSet> {
  return {
    header: EQUIPMENT_SLOT_ID_STRINGS[slotId],
    cellLayoutOption: DataTableCellLayout.Stacked,
    renderCell: ({ set }) => {
      const equipment = set[slotId];
      if (equipment === undefined) {
        return <span className="text-theme-muted">{NOTHING}</span>;
      }

      return (
        <>
          <div>{equipment.entityProperties.name}</div>
          <div className="text-sm text-theme-muted">{describeAffixes(equipment)}</div>
        </>
      );
    },
  };
}

export const SCORED_EQUIPMENT_SET_COLUMNS: DataTableColumn<ScoredEquipmentSet>[] = [
  { header: "Score", renderCell: ({ score }) => Math.floor(score) },
  {
    header: "Requires",
    cellLayoutOption: DataTableCellLayout.Stacked,
    renderCell: ({ requirements }) => describeRequirements(requirements),
  },
  ...iterateNumericEnum(EquipmentSlotId).map(slotColumn),
];

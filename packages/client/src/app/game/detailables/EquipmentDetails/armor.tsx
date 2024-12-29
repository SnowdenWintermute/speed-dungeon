import { Equipment, getTraitModifiedArmorClass } from "@speed-dungeon/common";
import { formatArmorCategory } from "@speed-dungeon/common";
import { EquipmentType } from "@speed-dungeon/common";

export function getArmorCategoryText(equipment: Equipment) {
  switch (equipment.equipmentBaseItemProperties.type) {
    case EquipmentType.BodyArmor:
    case EquipmentType.HeadGear:
      return ` (${formatArmorCategory(equipment.equipmentBaseItemProperties.armorCategory)})`;
    default:
      "";
  }
}

export function ArmorClassText({ equipment }: { equipment: Equipment }) {
  let armorClassOption: null | number = null;
  switch (equipment.equipmentBaseItemProperties.type) {
    case EquipmentType.BodyArmor:
    case EquipmentType.HeadGear:
    case EquipmentType.Shield:
      armorClassOption = equipment.equipmentBaseItemProperties.armorClass;
    default:
  }

  let hasTraitModifiedAc = false;
  let armorClassTextOption = null;
  if (typeof armorClassOption === "number") {
    const modifiedAc = getTraitModifiedArmorClass(armorClassOption, equipment.affixes);
    return <div>{`Armor Class: ${modifiedAc}`}</div>;
  }

  let modifiedAcStyle = hasTraitModifiedAc ? "text-blue-600" : "";

  if (armorClassTextOption) return <div className={modifiedAcStyle}>{armorClassTextOption}</div>;
  else return <></>;
}

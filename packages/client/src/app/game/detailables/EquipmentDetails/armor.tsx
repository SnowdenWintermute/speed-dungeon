import { EquipmentProperties, getTraitModifiedArmorClass } from "@speed-dungeon/common";
import { formatArmorCategory } from "@speed-dungeon/common";
import { EquipmentType } from "@speed-dungeon/common";

export function getArmorCategoryText(equipmentProperties: EquipmentProperties) {
  switch (equipmentProperties.equipmentTypeProperties.type) {
    case EquipmentType.BodyArmor:
    case EquipmentType.HeadGear:
      return formatArmorCategory(equipmentProperties.equipmentTypeProperties.armorCategory);
    default:
      return null;
  }
}

export function ArmorClassText({
  equipmentProperties,
}: {
  equipmentProperties: EquipmentProperties;
}) {
  let armorClassOption: null | number = null;
  switch (equipmentProperties.equipmentTypeProperties.type) {
    case EquipmentType.BodyArmor:
    case EquipmentType.HeadGear:
    case EquipmentType.Shield:
      armorClassOption = equipmentProperties.equipmentTypeProperties.armorClass;
    default:
  }

  let hasTraitModifiedAc = false;
  let armorClassTextOption = null;
  if (typeof armorClassOption === "number") {
    const modifiedAc = getTraitModifiedArmorClass(armorClassOption, equipmentProperties.traits);
    return `Armor Class: ${modifiedAc}`;
  }

  let modifiedAcStyle = hasTraitModifiedAc ? "text-blue-600" : "";

  if (armorClassTextOption) return <div className={modifiedAcStyle}>{armorClassTextOption}</div>;
  else return <></>;
}

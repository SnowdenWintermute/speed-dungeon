import {
  AffixType,
  Equipment,
  PrefixType,
  SuffixType,
  getModifiedArmorClass,
} from "@speed-dungeon/common";
import { formatArmorCategory } from "@speed-dungeon/common";
import { EquipmentType } from "@speed-dungeon/common";

export function getArmorCategoryText(equipment: Equipment) {
  switch (equipment.equipmentBaseItemProperties.equipmentType) {
    case EquipmentType.BodyArmor:
    case EquipmentType.HeadGear:
      return ` (${formatArmorCategory(equipment.equipmentBaseItemProperties.armorCategory)})`;
    default:
      "";
  }
}

export function ArmorClassText({ equipment }: { equipment: Equipment }) {
  let armorClassOption: null | number = null;
  switch (equipment.equipmentBaseItemProperties.equipmentType) {
    case EquipmentType.BodyArmor:
    case EquipmentType.HeadGear:
    case EquipmentType.Shield:
      armorClassOption = equipment.equipmentBaseItemProperties.armorClass;
    default:
  }

  if (typeof armorClassOption === "number") {
    const modifiedArmorClass = Equipment.getModifiedArmorClass(equipment);
    const acIsModified = !!(
      equipment.affixes[AffixType.Prefix][PrefixType.ArmorClass] ||
      equipment.affixes[AffixType.Suffix][SuffixType.PercentArmorClass]
    );
    let modifiedAcStyle = acIsModified ? "text-blue-300" : "";

    return <div className={modifiedAcStyle}>{modifiedArmorClass}</div>;
  } else return <></>;
}

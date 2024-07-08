import { CombatantAttributeRecord, Item, formatEquipmentType } from "@speed-dungeon/common";
import { EquipmentProperties } from "@speed-dungeon/common/src/items/equipment/equipment-properties";
import React from "react";
import { ArmorClassText, getArmorCategoryText } from "./armor";
import WeaponDamage from "./WeaponDamage";
import Durability from "./Durability";
import CombatAttributesAndTraits from "./CombatAttributesAndTraits";
import ItemRequirements from "../ItemRequirements";
import { useGameStore } from "@/stores/game-store";
import UnmetItemRequirementsCalculator from "../UnmetItemRequirementsCalculator";

interface Props {
  item: Item;
  equipmentProperties: EquipmentProperties;
  isComparedItem: boolean;
}

export default function EquipmentDetails({ item, equipmentProperties, isComparedItem }: Props) {
  const unmetRequirements = useGameStore().consideredItemUnmetRequirements;
  const armorCategoryTextOption = getArmorCategoryText(equipmentProperties);
  return (
    <div>
      {formatEquipmentType(equipmentProperties.equipmentBaseItemProperties.type)}
      {armorCategoryTextOption && <div>{armorCategoryTextOption}</div>}
      <ArmorClassText equipmentProperties={equipmentProperties} />
      <WeaponDamage equipmentProperties={equipmentProperties} />
      <Durability equipmentProperties={equipmentProperties} />
      <CombatAttributesAndTraits equipmentProperties={equipmentProperties} />
      <ItemRequirements
        attributeRequirements={item.requirements}
        unmetRequirements={unmetRequirements}
      />
      {!isComparedItem && (
        <UnmetItemRequirementsCalculator
          attributeRequirements={item.requirements}
          itemId={item.entityProperties.id}
        />
      )}
    </div>
  );
}

import React from "react";
import PaperDollSlot from "./PaperDollSlot";
import {
  CombatantAttributeRecord,
  EquipmentSlot,
  Item,
  ItemPropertiesType,
  equipmentIsTwoHandedWeapon,
} from "@speed-dungeon/common";

interface Props {
  equipment: Partial<Record<EquipmentSlot, Item>>;
  characterAttributes: CombatantAttributeRecord;
}

export default function PaperDoll({ equipment, characterAttributes }: Props) {
  const mainhandOption = equipment[EquipmentSlot.MainHand];
  const mainhandEquipmentType = (() => {
    if (!mainhandOption) return null;
    switch (mainhandOption.itemProperties.type) {
      case ItemPropertiesType.Equipment:
        return mainhandOption.itemProperties.equipmentProperties.equipmentBaseItemProperties.type;
      case ItemPropertiesType.Consumable:
        return null;
    }
  })();

  const mainHandIs2h =
    mainhandEquipmentType !== null ? equipmentIsTwoHandedWeapon(mainhandEquipmentType) : false;

  return (
    <div id="paper-doll" className="flex w-[23.75rem] mr-5">
      <div className="w-[7.5rem] mr-2.5">
        <div className="h-[6.25rem] mb-2.5 flex justify-between items-end">
          <PaperDollSlot
            itemOption={equipment[EquipmentSlot.RingR] ?? null}
            characterAttributes={characterAttributes}
            slot={EquipmentSlot.RingR}
            tailwindClasses=" h-10 max-h-10 w-10 max-w-10"
          />
          <PaperDollSlot
            itemOption={equipment[EquipmentSlot.RingL] ?? null}
            characterAttributes={characterAttributes}
            slot={EquipmentSlot.RingL}
            tailwindClasses=" h-10 max-h-10 w-10 max-w-10"
          />
        </div>
        <PaperDollSlot
          itemOption={equipment[EquipmentSlot.MainHand] ?? null}
          characterAttributes={characterAttributes}
          slot={EquipmentSlot.MainHand}
          tailwindClasses="h-[12.125rem] max-h-[12.125rem] w-full"
        />
      </div>
      <div className="w-[7.5rem] mr-2.5">
        <PaperDollSlot
          itemOption={equipment[EquipmentSlot.Head] ?? null}
          characterAttributes={characterAttributes}
          slot={EquipmentSlot.Head}
          tailwindClasses="h-[6.25rem] ?? null w-full mb-2.5"
        />
        <PaperDollSlot
          itemOption={equipment[EquipmentSlot.Body] ?? null}
          characterAttributes={characterAttributes}
          slot={EquipmentSlot.Body}
          tailwindClasses="h-[12.125rem] ?? null max-h-[12.125rem] w-full"
        />
      </div>
      <div className="w-[7.5rem]">
        <div className="h-[6.25rem] mb-2.5 flex justify-end items-end">
          <PaperDollSlot
            itemOption={equipment[EquipmentSlot.Amulet] ?? null}
            characterAttributes={characterAttributes}
            slot={EquipmentSlot.Amulet}
            tailwindClasses=" h-10 w-10"
          />
        </div>
        <PaperDollSlot
          itemOption={
            mainHandIs2h
              ? equipment[EquipmentSlot.MainHand]!
              : equipment[EquipmentSlot.OffHand] ?? null
          }
          characterAttributes={characterAttributes}
          slot={EquipmentSlot.OffHand}
          tailwindClasses={`h-[12.125rem] w-full ${mainHandIs2h ? " opacity-50" : ""}`}
        />
      </div>
    </div>
  );
}

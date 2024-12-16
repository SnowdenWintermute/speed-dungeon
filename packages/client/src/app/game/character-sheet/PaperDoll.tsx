import React, { useMemo } from "react";
import PaperDollSlot from "./PaperDollSlot";
import {
  CombatantEquipment,
  CombatantProperties,
  EquipmentSlotType,
  HoldableSlotType,
  WearableSlotType,
  equipmentIsTwoHandedWeapon,
} from "@speed-dungeon/common";

interface Props {
  combatantProperties: CombatantProperties;
}

export default function PaperDoll({ combatantProperties }: Props) {
  const equippedHoldables = CombatantEquipment.getEquippedHoldableSlots(combatantProperties);
  const { equipment } = combatantProperties;

  const totalAttributes = useMemo(
    () => CombatantProperties.getTotalAttributes(combatantProperties),
    [combatantProperties]
  );

  const mainhandOption = equippedHoldables?.holdables[HoldableSlotType.MainHand];

  const mainHandIs2h =
    mainhandOption?.equipmentBaseItemProperties.type !== undefined
      ? equipmentIsTwoHandedWeapon(mainhandOption.equipmentBaseItemProperties.type)
      : false;

  return (
    <div id="paper-doll" className="flex w-[23.75rem] mr-5">
      <div className="w-[7.5rem] mr-2.5">
        <div className="h-[6.25rem] mb-2.5 flex justify-between items-end">
          <PaperDollSlot
            itemOption={equipment.wearables[WearableSlotType.RingR] ?? null}
            characterAttributes={totalAttributes}
            slot={{ type: EquipmentSlotType.Wearable, slot: WearableSlotType.RingR }}
            tailwindClasses=" h-10 max-h-10 w-10 max-w-10"
          />
          <PaperDollSlot
            itemOption={equipment.wearables[WearableSlotType.RingL] ?? null}
            characterAttributes={totalAttributes}
            slot={{ type: EquipmentSlotType.Wearable, slot: WearableSlotType.RingL }}
            tailwindClasses=" h-10 max-h-10 w-10 max-w-10"
          />
        </div>
        <PaperDollSlot
          itemOption={equippedHoldables?.holdables[HoldableSlotType.MainHand] ?? null}
          characterAttributes={totalAttributes}
          slot={{ type: EquipmentSlotType.Holdable, slot: HoldableSlotType.MainHand }}
          tailwindClasses="h-[12.125rem] max-h-[12.125rem] w-full"
        />
      </div>
      <div className="w-[7.5rem] mr-2.5">
        {
          <PaperDollSlot
            itemOption={equipment.wearables[WearableSlotType.Head] ?? null}
            characterAttributes={totalAttributes}
            slot={{ type: EquipmentSlotType.Wearable, slot: WearableSlotType.Head }}
            tailwindClasses="h-[6.25rem] ?? null w-full mb-2.5"
          />
        }
        <PaperDollSlot
          itemOption={equipment.wearables[WearableSlotType.Body] ?? null}
          characterAttributes={totalAttributes}
          slot={{ type: EquipmentSlotType.Wearable, slot: WearableSlotType.Body }}
          tailwindClasses="h-[12.125rem] ?? null max-h-[12.125rem] w-full"
        />
      </div>
      <div className="w-[7.5rem]">
        <div className="h-[6.25rem] mb-2.5 flex justify-end items-end">
          <PaperDollSlot
            itemOption={equipment.wearables[WearableSlotType.Amulet] ?? null}
            characterAttributes={totalAttributes}
            slot={{ type: EquipmentSlotType.Wearable, slot: WearableSlotType.Amulet }}
            tailwindClasses=" h-10 w-10"
          />
        </div>
        <PaperDollSlot
          itemOption={
            mainHandIs2h
              ? mainhandOption!
              : equippedHoldables?.holdables[HoldableSlotType.OffHand] ?? null
          }
          characterAttributes={totalAttributes}
          slot={{ type: EquipmentSlotType.Holdable, slot: HoldableSlotType.OffHand }}
          tailwindClasses={`h-[12.125rem] w-full ${mainHandIs2h ? " opacity-50" : ""}`}
        />
      </div>
    </div>
  );
}

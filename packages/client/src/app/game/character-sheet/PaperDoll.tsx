import React, { useMemo } from "react";
import { PaperDollSlot } from "./PaperDollSlot";
import {
  Combatant,
  CombatantProperties,
  EquipmentSlotType,
  HoldableSlotType,
  WearableSlotType,
  equipmentIsTwoHandedWeapon,
} from "@speed-dungeon/common";
import { HotswapSlotButtons } from "../combatant-plaques/HotswapSlotButtons";
import { observer } from "mobx-react-lite";
import { AppStore } from "@/mobx-stores/app-store";
import { DialogElementName } from "@/mobx-stores/dialogs";

interface Props {
  combatant: Combatant;
}

export const PaperDoll = observer(({ combatant }: Props) => {
  const { combatantProperties, entityProperties } = combatant;
  const equippedHoldables = combatantProperties.equipment.getActiveHoldableSlot();
  const viewingDropShardsModal = AppStore.get().dialogStore.isOpen(DialogElementName.DropShards);

  const { equipment } = combatantProperties;

  const totalAttributes = useMemo(
    () => CombatantProperties.getTotalAttributes(combatantProperties),
    [combatantProperties]
  );

  const mainhandOption = equippedHoldables?.holdables[HoldableSlotType.MainHand];

  const mainHandIs2h =
    mainhandOption !== undefined
      ? equipmentIsTwoHandedWeapon(
          mainhandOption.equipmentBaseItemProperties.taggedBaseEquipment.equipmentType
        )
      : false;

  return (
    <div
      id="paper-doll"
      className={`relative flex w-[23.75rem] ${viewingDropShardsModal && "pointer-events-none opacity-50"}`}
    >
      <HotswapSlotButtons
        vertical={false}
        className={"absolute h-fit flex border border-slate-400"}
        entityId={entityProperties.id}
        selectedSlotIndex={combatantProperties.equipment.getSelectedHoldableSlotIndex()}
        numSlots={combatantProperties.equipment.getHoldableHotswapSlots().length}
      />
      <div className="w-[7.5rem] mr-2.5">
        <div className="h-[6.25rem] mb-2.5 flex justify-between items-end">
          <PaperDollSlot
            itemOption={equipment.getWearables()[WearableSlotType.RingR] ?? null}
            characterAttributes={totalAttributes}
            slot={{ type: EquipmentSlotType.Wearable, slot: WearableSlotType.RingR }}
            tailwindClasses=" h-10 max-h-10 w-10 max-w-10"
          />
          <PaperDollSlot
            itemOption={equipment.getWearables()[WearableSlotType.RingL] ?? null}
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
            itemOption={equipment.getWearables()[WearableSlotType.Head] ?? null}
            characterAttributes={totalAttributes}
            slot={{ type: EquipmentSlotType.Wearable, slot: WearableSlotType.Head }}
            tailwindClasses="h-[6.25rem] ?? null w-full mb-2.5"
          />
        }
        <PaperDollSlot
          itemOption={equipment.getWearables()[WearableSlotType.Body] ?? null}
          characterAttributes={totalAttributes}
          slot={{ type: EquipmentSlotType.Wearable, slot: WearableSlotType.Body }}
          tailwindClasses="h-[12.125rem] ?? null max-h-[12.125rem] w-full"
        />
      </div>
      <div className="w-[7.5rem]">
        <div className="h-[6.25rem] mb-2.5 flex justify-end items-end">
          <PaperDollSlot
            itemOption={equipment.getWearables()[WearableSlotType.Amulet] ?? null}
            characterAttributes={totalAttributes}
            slot={{ type: EquipmentSlotType.Wearable, slot: WearableSlotType.Amulet }}
            tailwindClasses=" h-10 w-10"
          />
        </div>
        <PaperDollSlot
          itemOption={
            mainHandIs2h
              ? mainhandOption!
              : (equippedHoldables?.holdables[HoldableSlotType.OffHand] ?? null)
          }
          characterAttributes={totalAttributes}
          slot={{ type: EquipmentSlotType.Holdable, slot: HoldableSlotType.OffHand }}
          tailwindClasses={`h-[12.125rem] w-full ${mainHandIs2h ? " opacity-50" : ""}`}
        />
      </div>
    </div>
  );
});

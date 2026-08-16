import React, { useMemo } from "react";
import { PaperDollSlot } from "./PaperDollSlot";
import { HotswapSlotButtons } from "./HotswapSlotButtons";
import { observer } from "mobx-react-lite";
import { useCharacterSheetSubject } from "./character-sheet-subject-context";
import { EquipmentSlotId } from "@speed-dungeon/common";

interface Props {
  dimmed?: boolean;
}

export const PaperDoll = observer(({ dimmed }: Props) => {
  const subject = useCharacterSheetSubject();
  const { combatantProperties } = subject.combatant;
  const equippedHoldables = combatantProperties.equipment.hotswapSlotsManager.activeSlot;

  const { equipment } = combatantProperties;

  const totalAttributes = useMemo(
    () => combatantProperties.attributeProperties.getTotalAttributes(),
    [combatantProperties]
  );

  const mainhandOption = equippedHoldables.slots[EquipmentSlotId.MainHand];

  const mainHandIs2h =
    mainhandOption.equipmentInSlot !== null ? mainhandOption.equipmentInSlot.isTwoHanded() : false;

  return (
    <div
      id="paper-doll"
      className={`relative flex w-[23.75rem] ${dimmed && "pointer-events-none opacity-50"}`}
    >
      <HotswapSlotButtons
        vertical={false}
        className={"absolute h-fit flex border border-slate-400"}
        onSelectSlotOption={subject.getHotswapSlotSelectionHandlerOption()}
        selectedSlotIndex={combatantProperties.equipment.hotswapSlotsManager.selectedIndex}
        slotsCount={combatantProperties.equipment.hotswapSlotsManager.allSlots.length}
      />
      <div className="w-[7.5rem] mr-2.5">
        <div className="h-[6.25rem] mb-2.5 flex justify-between items-end">
          <PaperDollSlot
            itemOption={equipment.staticSlots[EquipmentSlotId.FingerMain].equipmentInSlot}
            characterAttributes={totalAttributes}
            slotId={EquipmentSlotId.FingerMain}
            tailwindClasses=" h-10 max-h-10 w-10 max-w-10"
          />
          <PaperDollSlot
            itemOption={equipment.staticSlots[EquipmentSlotId.FingerAlternate].equipmentInSlot}
            characterAttributes={totalAttributes}
            slotId={EquipmentSlotId.FingerAlternate}
            tailwindClasses=" h-10 max-h-10 w-10 max-w-10"
          />
        </div>
        <PaperDollSlot
          itemOption={equippedHoldables.slots[EquipmentSlotId.MainHand].equipmentInSlot ?? null}
          characterAttributes={totalAttributes}
          slotId={EquipmentSlotId.MainHand}
          tailwindClasses="h-[12.125rem] max-h-[12.125rem] w-full"
        />
      </div>
      <div className="w-[7.5rem] mr-2.5">
        {
          <PaperDollSlot
            itemOption={equipment.staticSlots[EquipmentSlotId.Head].equipmentInSlot}
            characterAttributes={totalAttributes}
            slotId={EquipmentSlotId.Head}
            tailwindClasses="h-[6.25rem] ?? null w-full mb-2.5"
          />
        }
        <PaperDollSlot
          itemOption={equipment.staticSlots[EquipmentSlotId.Body].equipmentInSlot}
          characterAttributes={totalAttributes}
          slotId={EquipmentSlotId.Body}
          tailwindClasses="h-[12.125rem] ?? null max-h-[12.125rem] w-full"
        />
      </div>
      <div className="w-[7.5rem]">
        <div className="h-[6.25rem] mb-2.5 flex justify-end items-end">
          <PaperDollSlot
            itemOption={equipment.staticSlots[EquipmentSlotId.Neck].equipmentInSlot}
            characterAttributes={totalAttributes}
            slotId={EquipmentSlotId.Neck}
            tailwindClasses=" h-10 w-10"
          />
        </div>
        <PaperDollSlot
          itemOption={
            mainHandIs2h
              ? mainhandOption.equipmentInSlot
              : equippedHoldables.slots[EquipmentSlotId.OffHand].equipmentInSlot
          }
          characterAttributes={totalAttributes}
          slotId={EquipmentSlotId.OffHand}
          tailwindClasses={`h-[12.125rem] w-full ${mainHandIs2h ? " opacity-50" : ""}`}
        />
      </div>
    </div>
  );
});

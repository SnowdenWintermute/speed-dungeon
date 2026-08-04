import { HotkeyButton } from "@speed-dungeon/ui/atoms/HotkeyButton";
import { AbilityTreeAbility, AllocationProhibitedReason } from "@speed-dungeon/common";
import React, { ReactNode, useState } from "react";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { useCharacterSheetSubject } from "../character-sheet-subject-context";
import { observer } from "mobx-react-lite";

interface Props {
  ability: AbilityTreeAbility;
  abilityLevel: number;
  buttonContent: ReactNode;
  isAllocatable: { canAllocate: boolean; reasonCanNot?: AllocationProhibitedReason };
  isDetailed: boolean;
}

export const AbilityTreeButton = observer((props: Props) => {
  const [hovered, setHovered] = useState(false);
  const { ability, abilityLevel, buttonContent, isAllocatable, isDetailed } = props;
  const { detailableEntityFocus } = useClientApplication();
  const subject = useCharacterSheetSubject();

  const disabled = !isAllocatable.canAllocate && abilityLevel <= 0;
  const allocateAbilityPointOption = subject.getAbilityAllocationHandlerOption();

  // detailing an ability is reading it, so it works wherever the tree is rendered. allocating a
  // point to it is the part a viewer has to be allowed to do
  function handleClick() {
    if (!isDetailed) {
      detailableEntityFocus.combatantAbilities.setDetailed(ability);
      subject.handleAbilitySelected(ability);
      return;
    }

    if (!isAllocatable.canAllocate) {
      return;
    }

    allocateAbilityPointOption?.(ability);
  }

  return (
    <div className="bg-slate-700">
      <HotkeyButton
        className={`
        h-20 w-20 border border-slate-400 bg-slate-700  relative flex items-center justify-center
        ${isAllocatable.reasonCanNot === AllocationProhibitedReason.InherentTrait ? "bg-slate-800" : ""}
        ${disabled && "opacity-50 cursor-auto"} ${!isAllocatable.canAllocate ? "cursor-auto hover:border-white" : !isDetailed ? "cursor-pointer" : "cursor-cell hover:bg-slate-950"}
        `}
        onClick={handleClick}
        onMouseEnter={() => {
          detailableEntityFocus.combatantAbilities.setHovered(ability);
          setHovered(true);
        }}
        onMouseLeave={() => {
          detailableEntityFocus.combatantAbilities.clearHovered();
          setHovered(false);
        }}
      >
        {buttonContent}
        <div className="absolute h-5 w-5 -bottom-1 -right-1 border border-zinc-300 bg-slate-700 text-center align-middle leading-tight">
          {abilityLevel}
        </div>
      </HotkeyButton>
    </div>
  );
});

import React, { ReactNode } from "react";
import { ActionMenuNumberedButton } from "./ActionMenuNumberedButton";
import { AbilityTreeAbility, getAbilityTreeAbilityNameString } from "@speed-dungeon/common";
import { getAbilityIcon } from "@/app/game/character-sheet/ability-tree/ability-icons";
import { AppStore } from "@/mobx-stores/app-store";
import { ConsideringCombatantAbilityMenuState } from "../considering-tree-ability";

interface Props {
  abilityOption: undefined | AbilityTreeAbility;
  rowIndex: number;
  abilityTreeColumn: (AbilityTreeAbility | undefined)[];
}

export default function AbilityTreeAbilityButton(props: Props) {
  const { abilityOption, abilityTreeColumn, rowIndex } = props;

  let buttonText = "";
  let iconOption: ReactNode = <div />;
  if (abilityOption !== undefined) {
    buttonText = getAbilityTreeAbilityNameString(abilityOption);
    const iconGetter = getAbilityIcon(abilityOption);
    iconOption = iconGetter ? iconGetter("h-full p-2 fill-slate-400") : "icon";
  }

  function clickHandler() {
    if (abilityOption === undefined) {
      AppStore.get().focusStore.combatantAbilities.clearDetailed();
    } else {
      AppStore.get().focusStore.combatantAbilities.setDetailed(abilityOption);

      const filteredColumn = abilityTreeColumn.filter(Boolean) as AbilityTreeAbility[];

      AppStore.get().actionMenuStore.pushStack(
        new ConsideringCombatantAbilityMenuState(filteredColumn, abilityOption)
      );
    }
  }

  function focusHandler() {
    if (abilityOption === undefined) {
      AppStore.get().focusStore.combatantAbilities.clearHovered();
    } else {
      AppStore.get().focusStore.combatantAbilities.setHovered(abilityOption);
    }
  }

  function blurHandler() {
    AppStore.get().focusStore.combatantAbilities.clearHovered();
  }

  const displayIndex = rowIndex + 1;

  return (
    <ActionMenuNumberedButton
      hotkeys={[`Digit${displayIndex}`]}
      hotkeyLabel={displayIndex.toString()}
      focusHandler={focusHandler}
      blurHandler={blurHandler}
      clickHandler={clickHandler}
      disabled={abilityOption === undefined}
    >
      <div className="flex justify-between h-full w-full pr-2">
        <div className="flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis flex-1">
          {buttonText}
        </div>
        <div className="h-full flex items-center">{iconOption}</div>
      </div>
    </ActionMenuNumberedButton>
  );
}

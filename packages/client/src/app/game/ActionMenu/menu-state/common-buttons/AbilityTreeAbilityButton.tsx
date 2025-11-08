import React, { ReactNode } from "react";
import { ActionMenuNumberedButton } from "./ActionMenuNumberedButton";
import { AbilityTreeAbility, getAbilityTreeAbilityNameString } from "@speed-dungeon/common";
import { getAbilityIcon } from "@/app/game/character-sheet/ability-tree/ability-icons";
import { AppStore } from "@/mobx-stores/app-store";
import { ConsideringCombatantAbilityMenuState } from "../considering-tree-ability";

interface Props {
  abilityOption: undefined | AbilityTreeAbility;
  abilityIndex: number;
  abilityTreeColumn: (AbilityTreeAbility | undefined)[];
}

export default function AbilityTreeAbilityButton(props: Props) {
  const { abilityOption, abilityIndex, abilityTreeColumn } = props;

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
      AppStore.get().actionMenuStore.pushStack(
        new ConsideringCombatantAbilityMenuState(
          abilityTreeColumn.filter((item) => item !== undefined),
          abilityIndex
        )
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

  return (
    <ActionMenuNumberedButton
      hotkeys={[]}
      hotkeyLabel={""}
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

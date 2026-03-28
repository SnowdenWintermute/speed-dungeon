import React, { ReactNode } from "react";
import { ActionMenuNumberedButton } from "./ActionMenuNumberedButton";
import { AbilityTreeAbility, getAbilityTreeAbilityNameString } from "@speed-dungeon/common";
import { getAbilityIcon } from "@/app/game/character-sheet/ability-tree/ability-icons";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { ConsideringCombatantAbilityActionMenuScreen } from "@/client-application/action-menu/screens/ability-tree-ability";

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

  const clientApplication = useClientApplication();
  const { detailableEntityFocus, actionMenu } = clientApplication;

  function clickHandler() {
    if (abilityOption === undefined) {
      detailableEntityFocus.combatantAbilities.clearDetailed();
    } else {
      detailableEntityFocus.combatantAbilities.setDetailed(abilityOption);

      const filteredColumn = abilityTreeColumn.filter(
        (item): item is AbilityTreeAbility => item !== undefined
      );

      actionMenu.pushStack(
        new ConsideringCombatantAbilityActionMenuScreen(
          clientApplication,
          filteredColumn,
          abilityOption
        )
      );
    }
  }

  function focusHandler() {
    if (abilityOption === undefined) {
      detailableEntityFocus.combatantAbilities.clearHovered();
    } else {
      detailableEntityFocus.combatantAbilities.setHovered(abilityOption);
    }
  }

  function blurHandler() {
    detailableEntityFocus.combatantAbilities.clearHovered();
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
      <div className="flex justify-between h-full w-full px-2">
        <div className="flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis flex-1">
          {buttonText}
        </div>
        <div className="h-full flex items-center">{iconOption}</div>
      </div>
    </ActionMenuNumberedButton>
  );
}

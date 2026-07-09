import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import Divider from "@/app/components/atoms/Divider";
import { Combatant } from "@speed-dungeon/common";
import React from "react";
import { CharacterAttributes } from "../character-sheet/CharacterAttributes";
import CombatantTraitsDisplay from "./CombatantTraitsDisplay";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";

interface Props {
  combatant: Combatant;
}

export const CombatantDisplay = observer(({ combatant }: Props) => {
  const { combatantProperties } = combatant;
  const clientApplication = useClientApplication();
  const { detailableEntityFocus, actionMenu, uiStore } = clientApplication;

  function closeDisplay() {
    detailableEntityFocus.detailables.clear();
  }

  function closeIfNotInMenu() {
    console.log("heard");
    if (!actionMenu.hasStackedMenus()) {
      closeDisplay();
    }
  }

  return (
    <div className="flex justify-between pointer-events-auto">
      <CharacterAttributes combatant={combatant} showAttributeAssignmentButtons={false} />
      <div className="h-full pl-4 w-1/2">
        <div className="w-full flex justify-end">
          <ButtonBasic onClick={closeDisplay}>{"Close"}</ButtonBasic>
          <HotkeyButton
            onClick={closeIfNotInMenu}
            hotkeys={uiStore.keybinds.getKeybind(HotkeyButtonTypes.Cancel)}
            className="hidden"
            children={""}
          />
        </div>
        <div className="flex justify-between">
          <span>{"Traits "}</span>
          <span> </span>
        </div>
        <Divider />
        <ul>
          <CombatantTraitsDisplay
            traitProperties={combatantProperties.abilityProperties.getTraitProperties()}
          />
        </ul>
      </div>
    </div>
  );
});

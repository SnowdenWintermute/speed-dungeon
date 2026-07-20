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
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { IconName, SVG_ICONS } from "@/app/icons";
import { getCombatantModelAttributions } from "@/game-world-view/scene-entities/combatants/get-combatant-asset-attribution";

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
    if (!actionMenu.hasStackedMenus()) {
      closeDisplay();
    }
  }

  const modelAttributions = getCombatantModelAttributions(combatantProperties);

  return (
    <div className="flex justify-between pointer-events-auto">
      <CharacterAttributes combatant={combatant} showAttributeAssignmentButtons={false} />
      <div className="pl-4 w-1/2 flex flex-col">
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
        <ul className="relative flex-1">
          <CombatantTraitsDisplay
            traitProperties={combatantProperties.abilityProperties.getTraitProperties()}
          />
          {modelAttributions.length > 0 && (
            <div className="absolute bottom-0 left-0 flex flex-col items-end">
              {modelAttributions.map((attribution) => (
                <HoverableTooltipWrapper
                  key={attribution.name}
                  tooltipText={`3D model by ${attribution.name}`}
                >
                  <a
                    href={attribution.link}
                    target="_blank"
                    className="text-gray-400 text-sm w-fit text-center align-middle"
                  >
                    {SVG_ICONS[IconName.Model3DIcon](
                      "inline stroke-gray-400 h-4 w-4 mr-1 align-middle"
                    )}
                    <span className="align-middle">{attribution.name}</span>
                  </a>
                </HoverableTooltipWrapper>
              ))}
            </div>
          )}
        </ul>
      </div>
    </div>
  );
});

import XShape from "../../../../public/img/basic-shapes/x-shape.svg";
import { Vector3 } from "@babylonjs/core";
import {
  CharacterControlScheme,
  DEFAULT_ACCOUNT_CHARACTER_CAPACITY,
  GameMode,
  NextOrPrevious,
  getNextOrPreviousNumber,
} from "@speed-dungeon/common";
import React, { useEffect, useState } from "react";
import ArrowShape from "../../../../public/img/menu-icons/arrow-button-icon.svg";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import CreateCharacterForm from "./CreateCharacterForm";
import DeleteCharacterForm from "./DeleteCharacterForm";
import { CharacterModelDisplay } from "@/app/character-model-display";
import { observer } from "mobx-react-lite";
import { CHARACTER_SLOT_SPACING } from "@/client-consts";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { DialogElementName } from "@/client-application/ui/dialogs";
import { SelectDropdown } from "@/app/components/atoms/SelectDropdown";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";
import { keyValueToDisplayString } from "@/client-application/ui/keyboard-layouts";


export const SavedCharacterManager = observer(() => {
  const [currentSlot, setCurrentSlot] = useState(1);
  const clientApplication = useClientApplication();
  const { lobbyContext, uiStore } = clientApplication;

  const savedCharacters =
    lobbyContext.savedCharacters.byControlScheme[
      lobbyContext.savedCharacters.selectedCharacterControlScheme
    ];

  const selectedCharacterOption = savedCharacters[currentSlot];
  const { dialogs, keybinds } = uiStore;
  const openManagerHotkeys = keybinds.getKeybind(HotkeyButtonTypes.OpenCharacterManager);
  const openManagerKeyLabel = keyValueToDisplayString(openManagerHotkeys[0] ?? "");
  const showGameCreationForm = dialogs.isOpen(DialogElementName.GameCreation);
  const showCharacterManager = dialogs.isOpen(DialogElementName.SavedCharacterManager);

  useEffect(() => {
    const camera = clientApplication.gameWorldView?.camera;
    if (!camera) return;
    camera.target.copyFrom(
      new Vector3(CHARACTER_SLOT_SPACING + -CHARACTER_SLOT_SPACING * currentSlot, 1, 0)
    );
    camera.alpha = Math.PI / 2;
    camera.beta = (Math.PI / 5) * 2;
    camera.radius = 4.28;
  }, [currentSlot, clientApplication.gameWorldView?.camera]);

  useEffect(() => {
    if (!showCharacterManager) {
      setCurrentSlot(1);
    }
  }, [showCharacterManager]);

  return (
    <>
      <div className="w-full h-full absolute">
        <div className="absolute w-32 left-1/3 -translate-x-10 top-1/2 -translate-y-1/2">
          <SelectDropdown
            title={"Control Scheme"}
            value={lobbyContext.savedCharacters.selectedCharacterControlScheme}
            setValue={(value) => {
              lobbyContext.savedCharacters.selectedCharacterControlScheme = value;
              clientApplication.gameWorldView?.sceneEntityService.combatantSceneEntityManager.synchronizeCombatantModels(
                { softCleanup: false }
              );
            }}
            options={[
              { title: "Freelancer", value: CharacterControlScheme.Freelancer },
              { title: "Captain", value: CharacterControlScheme.Captain },
            ]}
            disabled={undefined}
          />
        </div>
        {savedCharacters.map((character) => {
          const { combatant } = character;

          return (
            <CharacterModelDisplay
              combatantId={combatant.getEntityId()}
              key={combatant.entityProperties.id}
            >
              <div className="w-full h-full flex justify-center items-center">
                {combatant.combatantProperties.isDead() && (
                  <div className="relative text-2xl">
                    <span
                      className="text-red-600"
                      style={{
                        textShadow: "2px 2px 0px #000000",
                      }}
                    >
                      DEAD
                    </span>
                  </div>
                )}
              </div>
            </CharacterModelDisplay>
          );
        })}
      </div>

      {!showCharacterManager && !showGameCreationForm && (
        <div className="absolute bottom-40">
          <HoverableTooltipWrapper
            offsetTop={8}
            tooltipText={`Create or delete characters for the 'Progression' game mode (${openManagerKeyLabel})`}
          >
            <HotkeyButton
              className="h-10 pr-2 pl-2 flex items-center border border-slate-400 bg-slate-700 pointer-events-auto"
              hotkeys={openManagerHotkeys}
              onClick={() => {
                dialogs.open(DialogElementName.SavedCharacterManager);
              }}
            >
              MANAGE SAVED CHARACTERS
            </HotkeyButton>
          </HoverableTooltipWrapper>
        </div>
      )}
      {showCharacterManager && (
        <div className="w-[300px] h-[64vh] flex flex-col justify-between relative">
          <div className="p-4 w-full flex flex-col justify-center items-center bg-slate-700 border-slate-400 border pointer-events-auto">
            <HotkeyButton
              className="h-10 w-10 p-2 border-b border-l absolute top-0 right-0 border-slate-400"
              hotkeys={["Escape"]}
              onClick={() => dialogs.close(DialogElementName.SavedCharacterManager)}
            >
              <XShape className="h-full w-full fill-slate-400" />
            </HotkeyButton>
            <h4>{`Slot ${currentSlot}`}</h4>
            <h3>{selectedCharacterOption?.combatant.entityProperties.name || "Empty"}</h3>
            {selectedCharacterOption && (
              <div>
                Level: {selectedCharacterOption.combatant.getLevel()}
                {" " +
                  selectedCharacterOption.combatant.combatantProperties.classProgressionProperties
                    .getMainClass()
                    .getStringName()}
              </div>
            )}
          </div>
          <div className="flex justify-between absolute top-1/2 -translate-y-1/2 w-full">
            <HoverableTooltipWrapper tooltipText="Previous slot (W)">
              <HotkeyButton
                className="bg-slate-700 h-10 w-10 p-2 border border-slate-400 pointer-events-auto"
                hotkeys={keybinds.getKeybind(HotkeyButtonTypes.CycleBack)}
                onClick={() => {
                  const newSlot = getNextOrPreviousNumber(
                    currentSlot,
                    DEFAULT_ACCOUNT_CHARACTER_CAPACITY - 1,
                    NextOrPrevious.Previous,
                    { minNumber: 0 }
                  );
                  setCurrentSlot(newSlot);
                }}
              >
                <ArrowShape className="fill-slate-400 h-full w-full" />
              </HotkeyButton>
            </HoverableTooltipWrapper>
            <HoverableTooltipWrapper tooltipText="Next slot (E)">
              <HotkeyButton
                className="bg-slate-700 h-10 w-10 p-2 border border-slate-400 pointer-events-auto"
                hotkeys={keybinds.getKeybind(HotkeyButtonTypes.CycleForward)}
                onClick={() => {
                  const newSlot = getNextOrPreviousNumber(
                    currentSlot,
                    DEFAULT_ACCOUNT_CHARACTER_CAPACITY - 1,
                    NextOrPrevious.Next,
                    { minNumber: 0 }
                  );
                  setCurrentSlot(newSlot);
                }}
              >
                <ArrowShape className="fill-slate-400 h-full w-full -scale-x-100" />
              </HotkeyButton>
            </HoverableTooltipWrapper>
          </div>
          <div>
            {selectedCharacterOption ? (
              <DeleteCharacterForm character={selectedCharacterOption.combatant} />
            ) : (
              <CreateCharacterForm
                controlScheme={lobbyContext.savedCharacters.selectedCharacterControlScheme}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
});

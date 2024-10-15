import XShape from "../../../../public/img/basic-shapes/x-shape.svg";
import { nextToBabylonMessageQueue } from "@/singletons/next-to-babylon-message-queue";
import { websocketConnection } from "@/singletons/websocket-connection";
import { useLobbyStore } from "@/stores/lobby-store";
import { NextToBabylonMessageTypes } from "@/singletons/next-to-babylon-message-queue";
import { Vector3 } from "@babylonjs/core";
import {
  ClientToServerEvent,
  Combatant,
  CombatantClass,
  DEFAULT_ACCOUNT_CHARACTER_CAPACITY,
  formatCombatantClassName,
  iterateNumericEnum,
} from "@speed-dungeon/common";
import React, { useEffect, useState } from "react";
import ArrowShape from "../../../../public/img/menu-icons/arrow-button-icon.svg";
import HotkeyButton from "@/app/components/atoms/HotkeyButton";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import TextInput from "@/app/components/atoms/TextInput";

const CHARACTER_SLOT_SPACING = 1;

export default function SavedCharacterManager() {
  const savedCharacters = useLobbyStore().savedCharacters;
  const [selectedNewCharacterClass, setSelectedNewCharacterClass] = useState(CombatantClass.Mage);
  const [newCharacterName, setNewCharacterName] = useState("");
  const [currentSlot, setCurrentSlot] = useState(1);
  const selectedCharacterOption = savedCharacters[currentSlot];

  useEffect(() => {
    console.log("asking for saved characters");
    websocketConnection.emit(ClientToServerEvent.GetSavedCharactersList);
  }, []);

  useEffect(() => {
    nextToBabylonMessageQueue.messages.push({
      type: NextToBabylonMessageTypes.MoveCamera,
      instant: true,
      alpha: Math.PI / 2,
      beta: (Math.PI / 5) * 2,
      radius: 5,
      target: new Vector3(-CHARACTER_SLOT_SPACING + CHARACTER_SLOT_SPACING * currentSlot, 1, 0),
    });
  }, [currentSlot]);

  function createCharacter() {
    websocketConnection.emit(
      ClientToServerEvent.CreateSavedCharacter,
      newCharacterName,
      selectedNewCharacterClass,
      currentSlot
    );
  }

  function deleteCharacter() {
    websocketConnection.emit(
      ClientToServerEvent.DeleteSavedCharacter,
      selectedCharacterOption?.entityProperties.id || ""
    );
  }

  return (
    <>
      {Object.entries(savedCharacters)
        .filter(([_slot, characterOption]) => characterOption !== null)
        .map(([slot, character]) => (
          <SavedCharacterDisplay
            character={character!}
            index={parseInt(slot)}
            key={character!.entityProperties.id}
          />
        ))}
      <div className="w-[300px] h-[64vh] flex flex-col justify-between relative">
        <div className="p-4 w-full flex flex-col justify-center items-center bg-slate-700 border-slate-400 border pointer-events-auto">
          <h4>{!selectedCharacterOption && ` Slot ${currentSlot + 1} `}</h4>
          <h3>{selectedCharacterOption?.entityProperties.name || "Empty"}</h3>
          {selectedCharacterOption && (
            <div>
              Level: {selectedCharacterOption.combatantProperties.level}
              {" " +
                formatCombatantClassName(
                  selectedCharacterOption.combatantProperties.combatantClass
                )}
            </div>
          )}
        </div>
        <div className="flex justify-between absolute top-1/2 -translate-y-1/2 w-full">
          <HoverableTooltipWrapper tooltipText="Previous slot (W)">
            <HotkeyButton
              className="bg-slate-700 h-10 w-10 p-2 border border-slate-400 pointer-events-auto"
              hotkey="KeyW"
              onClick={() => {
                const newSlot =
                  currentSlot + 1 === DEFAULT_ACCOUNT_CHARACTER_CAPACITY ? 0 : currentSlot + 1;
                setCurrentSlot(newSlot);
              }}
            >
              <ArrowShape className="fill-slate-400 h-full w-full" />
            </HotkeyButton>
          </HoverableTooltipWrapper>
          <HoverableTooltipWrapper tooltipText="Next slot (E)">
            <HotkeyButton
              className="bg-slate-700 h-10 w-10 p-2 border border-slate-400 pointer-events-auto"
              hotkey="KeyE"
              onClick={() => {
                const newSlot =
                  currentSlot - 1 < 0 ? DEFAULT_ACCOUNT_CHARACTER_CAPACITY - 1 : currentSlot - 1;
                setCurrentSlot(newSlot);
              }}
            >
              <ArrowShape className="fill-slate-400 h-full w-full -scale-x-100" />
            </HotkeyButton>
          </HoverableTooltipWrapper>
        </div>
        <div>
          {selectedCharacterOption ? (
            <HotkeyButton
              className="bg-slate-700 h-10 w-full p-2 border border-slate-400 pointer-events-auto"
              onClick={deleteCharacter}
            >
              DELETE CHARACTER
            </HotkeyButton>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createCharacter();
              }}
            >
              <div className="pointer-events-auto flex justify-between mb-2">
                {iterateNumericEnum(CombatantClass).map((combatantClass) => (
                  <button
                    type="button"
                    className={`${selectedNewCharacterClass === combatantClass ? "bg-slate-950" : "bg-slate-700"} h-10 border border-slate-400 flex items-center pl-2 pr-2`}
                    onClick={() => setSelectedNewCharacterClass(combatantClass)}
                  >
                    <div>{formatCombatantClassName(combatantClass)}</div>
                  </button>
                ))}
              </div>
              <TextInput
                placeholder="Character name"
                name={"Character name"}
                extraStyles="mb-2 w-full"
                changeHandler={(e) => setNewCharacterName(e.target.value)}
                value={newCharacterName}
              />
              <HotkeyButton
                buttonType="submit"
                className="bg-slate-700 h-10 w-full p-2 border border-slate-400 pointer-events-auto"
              >
                CREATE CHARACTER
              </HotkeyButton>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

function SavedCharacterDisplay({ character, index }: { character: Combatant; index: number }) {
  const { entityProperties, combatantProperties } = character;
  const entityId = entityProperties.id;

  useEffect(() => {
    // display them in "slots" in the 3d world
    const modelDomPositionElement = document.getElementById(
      `${entityId}-position-div`
    ) as HTMLDivElement | null;
    if (modelDomPositionElement === null) return;

    nextToBabylonMessageQueue.messages.push({
      type: NextToBabylonMessageTypes.SpawnCombatantModel,
      combatantModelBlueprint: {
        entityId: entityProperties.id,
        species: combatantProperties.combatantSpecies,
        monsterType: null,
        class: combatantProperties.combatantClass,
        startPosition: new Vector3(-CHARACTER_SLOT_SPACING + index * CHARACTER_SLOT_SPACING, 0, 0),
        startRotation: 0,
        modelCorrectionRotation: 0,
        modelDomPositionElement,
      },
      checkIfRoomLoaded: false,
    });

    return () => {
      nextToBabylonMessageQueue.messages.push({
        type: NextToBabylonMessageTypes.RemoveCombatantModel,
        entityId,
      });
    };
  }, []);
  return (
    <div id={`${entityId}-position-div`} className="absolute flex flex-col items-center"></div>
  );
}

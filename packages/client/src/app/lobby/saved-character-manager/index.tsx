import XShape from "../../../../public/img/basic-shapes/x-shape.svg";
import { nextToBabylonMessageQueue } from "@/singletons/next-to-babylon-message-queue";
import { websocketConnection } from "@/singletons/websocket-connection";
import { useLobbyStore } from "@/stores/lobby-store";
import { NextToBabylonMessageTypes } from "@/singletons/next-to-babylon-message-queue";
import { Vector3 } from "@babylonjs/core";
import {
  ClientToServerEvent,
  DEFAULT_ACCOUNT_CHARACTER_CAPACITY,
  formatCombatantClassName,
} from "@speed-dungeon/common";
import React, { useEffect, useState } from "react";
import ArrowShape from "../../../../public/img/menu-icons/arrow-button-icon.svg";
import HotkeyButton from "@/app/components/atoms/HotkeyButton";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import SavedCharacterDisplay from "./SavedCharacterDisplay";
import CreateCharacterForm from "./CreateCharacterForm";
import { useHttpRequestStore } from "@/stores/http-request-store";
import { HTTP_REQUEST_NAMES } from "@/client_consts";
import DeleteCharacterForm from "./DeleteCharacterForm";
import { ZIndexLayers } from "@/app/z-index-layers";

export const CHARACTER_SLOT_SPACING = 1;
export const CHARACTER_MANAGER_HOTKEY = "S";

export default function SavedCharacterManager() {
  const savedCharacters = useLobbyStore().savedCharacters;
  const websocketConnected = useLobbyStore().websocketConnected;
  const [currentSlot, setCurrentSlot] = useState(1);
  const selectedCharacterOption = savedCharacters[currentSlot];
  const showCharacterManager = useLobbyStore().showSavedCharacterManager;
  const mutateLobbyState = useLobbyStore().mutateState;
  const showGameCreationForm = useLobbyStore().showGameCreationForm;
  const currentSessionHttpResponseTracker =
    useHttpRequestStore().requests[HTTP_REQUEST_NAMES.GET_SESSION];
  const isLoggedIn = currentSessionHttpResponseTracker?.statusCode === 200;

  useEffect(() => {
    if (websocketConnected) {
      // console.log(
      //   "requested saved characters list socket is connected: ",
      //   websocketConnection.connected
      // );
      // websocketConnection.emit(ClientToServerEvent.GetSavedCharactersList);
    }
  }, [isLoggedIn, websocketConnected]);

  useEffect(() => {
    nextToBabylonMessageQueue.messages.push({
      type: NextToBabylonMessageTypes.MoveCamera,
      instant: true,
      alpha: Math.PI / 2,
      beta: (Math.PI / 5) * 2,
      radius: 4.28,
      target: new Vector3(-CHARACTER_SLOT_SPACING + CHARACTER_SLOT_SPACING * currentSlot, 1, 0),
    });
  }, [currentSlot]);

  return (
    <>
      <div className="w-full h-full absolute">
        {Object.entries(savedCharacters)
          .filter(([_slot, characterOption]) => characterOption !== null)
          .map(([slot, character]) => {
            return (
              <SavedCharacterDisplay
                character={character!.combatant}
                index={parseInt(slot)}
                key={character!.combatant.entityProperties.id}
              >
                <div className="w-full h-full flex justify-center items-center">
                  {character!.combatant.combatantProperties.hitPoints <= 0 && (
                    <div className="relative text-2xl">
                      <span
                        className="text-red-600"
                        style={{
                          textShadow: "2px 2px 2px #000000",
                        }}
                      >
                        DEAD
                      </span>
                    </div>
                  )}
                </div>
              </SavedCharacterDisplay>
            );
          })}
      </div>

      {!showCharacterManager && !showGameCreationForm && (
        <div className="absolute bottom-40">
          <HoverableTooltipWrapper
            offsetTop={8}
            tooltipText={`Create or delete characters for the 'Progression' game mode (${CHARACTER_MANAGER_HOTKEY})`}
          >
            <HotkeyButton
              className="h-10 pr-2 pl-2 flex items-center border border-slate-400 bg-slate-700 pointer-events-auto"
              hotkeys={[`Key${CHARACTER_MANAGER_HOTKEY}`]}
              onClick={() => {
                mutateLobbyState((state) => {
                  state.showSavedCharacterManager = true;
                });
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
              hotkeys={["Escape", `Key${CHARACTER_MANAGER_HOTKEY}`]}
              onClick={() =>
                mutateLobbyState((state) => {
                  state.showSavedCharacterManager = false;
                })
              }
            >
              <XShape className="h-full w-full fill-slate-400" />
            </HotkeyButton>
            <h4>{!selectedCharacterOption && ` Slot ${currentSlot + 1} `}</h4>
            <h3>{selectedCharacterOption?.combatant.entityProperties.name || "Empty"}</h3>
            {selectedCharacterOption && (
              <div>
                Level: {selectedCharacterOption.combatant.combatantProperties.level}
                {" " +
                  formatCombatantClassName(
                    selectedCharacterOption.combatant.combatantProperties.combatantClass
                  )}
              </div>
            )}
          </div>
          <div className="flex justify-between absolute top-1/2 -translate-y-1/2 w-full">
            <HoverableTooltipWrapper tooltipText="Previous slot (W)">
              <HotkeyButton
                className="bg-slate-700 h-10 w-10 p-2 border border-slate-400 pointer-events-auto"
                hotkeys={["KeyW"]}
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
                hotkeys={["KeyE"]}
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
              <DeleteCharacterForm character={selectedCharacterOption.combatant} />
            ) : (
              <CreateCharacterForm currentSlot={currentSlot} />
            )}
          </div>
        </div>
      )}
    </>
  );
}

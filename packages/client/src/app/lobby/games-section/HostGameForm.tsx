import { ClientToServerEvent, GameMode, formatGameMode } from "@speed-dungeon/common";
import React, { FormEvent, useState } from "react";
import TextInput from "@/app/components/atoms/TextInput";
import { websocketConnection } from "@/singletons/websocket-connection";
import { useHttpRequestStore } from "@/stores/http-request-store";
import { HTTP_REQUEST_NAMES } from "@/client_consts";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import Divider from "@/app/components/atoms/Divider";
import HotkeyButton from "@/app/components/atoms/HotkeyButton";

export default function HostGameForm() {
  const currentSessionHttpResponseTracker =
    useHttpRequestStore().requests[HTTP_REQUEST_NAMES.GET_SESSION];
  const isLoggedIn = currentSessionHttpResponseTracker?.statusCode === 200;
  const [selectedGameMode, setSelectedGameMode] = useState(
    isLoggedIn ? GameMode.Progression : GameMode.Race
  );
  const [isRanked, setIsRanked] = useState(false);
  const [gameName, setGameName] = useState("");
  const [gamePassword, setGamePassword] = useState("");

  function createGame(
    event: FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) {
    event.preventDefault();
    websocketConnection.emit(ClientToServerEvent.CreateGame, {
      gameName,
      mode: selectedGameMode,
      isRanked,
    });
  }

  return (
    <form
      id="create-game-form"
      className="w-full p-4 border border-t-0 border-slate-400 bg-slate-700"
      onSubmit={createGame}
    >
      <div className="flex flex-1 flex-col mb-2">
        <div className="flex mb-2">
          <TextInput
            className="bg-slate-700 border border-slate-400 h-10 p-4 min-w-0 flex-1 mr-1"
            type="text"
            name="game name"
            placeholder="Game name..."
            changeHandler={(e) => setGameName(e.target.value)}
            value={gameName}
            autoComplete="new-password"
          />
          <TextInput
            className="bg-slate-700 border border-slate-400 h-10 p-4 min-w-0 flex-1 ml-1"
            type="password"
            name="password"
            placeholder="Password..."
            changeHandler={(e) => setGamePassword(e.target.value)}
            value={gamePassword}
            autoComplete="new-password"
          />
        </div>
        <div className="flex items-center font-bold">
          Game mode: {formatGameMode(selectedGameMode)}
        </div>
        <Divider />
        <div className="mb-4">
          {selectedGameMode === GameMode.Race && (
            <p>
              Race to the bottom of the dungeon! Face off against other parties or go for a personal
              best time. This mode uses all new level 1 characters which can be controlled by
              individual players.
            </p>
          )}
          {selectedGameMode === GameMode.Progression && (
            <p>
              Level up your existing characters and try to reach deeper floors and find better
              equipment. You may only control one character so it may be a good idea to bring some
              friends.
            </p>
          )}
        </div>
        <div className="flex flex-col mb-2">
          <div className="flex w-full mb-2">
            <HotkeyButton
              buttonType="button"
              hotkeys={["KeyW"]}
              onClick={() => {
                setSelectedGameMode(GameMode.Race);
                setIsRanked(false);
              }}
              className={`flex-1 h-10 border border-slate-400 
                        ${selectedGameMode === GameMode.Race && !isRanked ? "bg-slate-950" : "bg-slate-700"}
                        mr-1
                        `}
            >
              RACE
            </HotkeyButton>
            <HoverableTooltipWrapper
              tooltipText={isLoggedIn ? undefined : "You must be logged in to select this"}
              extraStyles="flex-1 ml-1 "
            >
              <HotkeyButton
                buttonType="button"
                hotkeys={["KeyE"]}
                disabled={!isLoggedIn}
                onClick={() => {
                  setSelectedGameMode(GameMode.Progression);
                }}
                className={`flex-1 h-10 w-full border border-slate-400
                        ${selectedGameMode === GameMode.Progression ? "bg-slate-950" : "bg-slate-700"}
                        disabled:opacity-50
                        `}
              >
                PROGRESSION
              </HotkeyButton>
            </HoverableTooltipWrapper>
          </div>
          <div className="flex w-full mb-2">
            <div id="game-mode-spacer" className={`flex-1 h-10 mr-1`} />
            <HoverableTooltipWrapper
              tooltipText={isLoggedIn ? undefined : "You must be logged in to select this"}
              extraStyles="flex-1 ml-1 "
            >
              <HotkeyButton
                buttonType="button"
                hotkeys={["KeyD"]}
                disabled={!isLoggedIn}
                onClick={() => {
                  setSelectedGameMode(GameMode.Race);
                  setIsRanked(true);
                }}
                className={`flex-1 h-10 w-full border border-slate-400
                        ${selectedGameMode === GameMode.Race && isRanked ? "bg-slate-950" : "bg-slate-700"}
                        disabled:opacity-50
                        `}
              >
                RACE (RANKED)
              </HotkeyButton>
            </HoverableTooltipWrapper>
          </div>
        </div>
        <HotkeyButton
          buttonType="submit"
          hotkeys={["KeyR", "Enter"]}
          onClick={(e) => {
            createGame(e);
          }}
          className="h-10 w-full border border-slate-400 bg-slate-700"
        >
          CREATE
        </HotkeyButton>
      </div>
    </form>
  );
}

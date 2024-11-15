import HotkeyButton from "@/app/components/atoms/HotkeyButton";
import { websocketConnection } from "@/singletons/websocket-connection";
import { useGameStore } from "@/stores/game-store";
import {
  ClientToServerEvent,
  SpeedDungeonGame,
  SpeedDungeonPlayer,
  formatGameMode,
} from "@speed-dungeon/common";
import React, { ReactNode, useEffect, useRef, useState } from "react";
import XShape from "../../../../public/img/basic-shapes/x-shape.svg";
import { SPACING_REM_LARGE } from "@/client_consts";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";

interface Props {
  game: SpeedDungeonGame;
  children: ReactNode;
}

export default function GameLobby({ game, children }: Props) {
  const username = useGameStore().username;
  const titleRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  function handleResize() {
    const headerHeightOption = titleRef.current?.getBoundingClientRect().height;
    const headerHeight = headerHeightOption || 0;
    const newHeight = window.innerHeight - SPACING_REM_LARGE * 2 - headerHeight - 100;
    setContainerHeight(newHeight);
  }

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function leaveGame() {
    websocketConnection.emit(ClientToServerEvent.LeaveGame);
  }
  function toggleReady() {
    websocketConnection.emit(ClientToServerEvent.ToggleReadyToStartGame);
  }

  const isReady = username && game.playersReadied.includes(username);
  const readyStyle = isReady ? "bg-green-800" : "";

  return (
    <div className="w-full h-full flex flex-col">
      <div
        ref={titleRef}
        id="game-title-container"
        className="p-2 border-slate-400 border-b bg-slate-700 h-fit w-full relative pointer-events-auto flex"
      >
        <div className="mr-4">
          <h2 className="text-xl">{game.name}</h2>
          <h4 className="text-slate-400">{formatGameMode(game.mode) + " game"}</h4>
        </div>
        <div className="w-[1px] h-full bg-slate-400 mr-4" />
        <ul className="flex items-center">
          <div className="text-lg mr-2">Players:</div>
          {Object.values(game.players).map((player) => (
            <PlayerInGameIcon
              playersReadied={game.playersReadied}
              player={player}
              key={player.username}
            />
          ))}
        </ul>
        <HotkeyButton
          className="h-10 w-10 p-2 border-b border-l absolute top-0 right-0 border-slate-400"
          hotkeys={["Escape"]}
          onClick={() => leaveGame()}
        >
          <XShape className="h-full w-full fill-slate-400" />
        </HotkeyButton>
      </div>
      <div
        style={{
          height: `${containerHeight}px`,
          padding: `${SPACING_REM_LARGE}rem`,
        }}
      >
        {children}
      </div>
      <div className="absolute z-10 bottom-0 left-0 w-full p-7 flex items-center justify-center">
        <HotkeyButton
          hotkeys={["Space"]}
          onClick={toggleReady}
          className={`border border-slate-400 h-20 cursor-pointer pr-10 pl-10 
                        flex justify-center items-center disabled:opacity-50 pointer-events-auto 
                        disabled:cursor-auto text-xl ${isReady ? readyStyle : "bg-slate-950"} text-slate-400
                        `}
        >
          READY
        </HotkeyButton>
      </div>
    </div>
  );
}

function PlayerInGameIcon({
  playersReadied,
  player,
}: {
  playersReadied: string[];
  player: SpeedDungeonPlayer;
}) {
  const bgStyle = playersReadied.includes(player.username)
    ? "bg-green-800"
    : player.partyName
      ? "bg-slate-950"
      : "bg-slate-700";

  return (
    <HoverableTooltipWrapper tooltipText={player.username} extraStyles="mr-2 last:mr-0">
      <li
        className={`
        pointer-events-auto h-10 w-10 flex items-center justify-center border border-slate-400 rounded-full p-2 text-lg
        ${bgStyle}
      `}
      >
        {player.username.charAt(0).toUpperCase()}
      </li>
    </HoverableTooltipWrapper>
  );
}

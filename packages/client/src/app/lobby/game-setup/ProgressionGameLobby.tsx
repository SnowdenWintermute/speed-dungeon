import HotkeyButton from "@/app/components/atoms/HotkeyButton";
import { websocketConnection } from "@/singletons/websocket-connection";
import {
  BASE_SCREEN_SIZE,
  ClientToServerEvent,
  GOLDEN_RATIO,
  SpeedDungeonGame,
  formatGameMode,
} from "@speed-dungeon/common";
import React, { useEffect, useState } from "react";
import XShape from "../../../../public/img/basic-shapes/x-shape.svg";

export default function ProgressionGameLobby({ game }: { game: SpeedDungeonGame }) {
  const [playerDisplays, setPlayerDisplays] = useState<string[]>([]);

  function leaveGame() {
    websocketConnection.emit(ClientToServerEvent.LeaveGame);
  }
  function toggleReady() {
    websocketConnection.emit(ClientToServerEvent.ToggleReadyToStartGame);
  }

  const menuWidth = Math.floor(BASE_SCREEN_SIZE * Math.pow(GOLDEN_RATIO, 3));

  const playerNamesConcat = Object.values(game.players)
    .map((player) => player.username)
    .join("");

  useEffect(() => {
    const playerNames: string[] = [];
    const players = Object.values(game.players);
    for (let i = 0; i < 3; i += 1) {
      const player = players[i];
      console.log("player: ", player);
      if (player) playerNames.push(player.username);
      else playerNames.push("no player");
    }

    setPlayerDisplays(playerNames);
  }, [playerNamesConcat]);

  console.log("playerNamesConcat", playerNamesConcat);

  return (
    <div className="w-full h-full flex ">
      <div
        id="game-title-container"
        className="p-2 border-slate-400 border bg-slate-700 h-fit relative pointer-events-auto"
        style={{ width: `${menuWidth}px` }}
      >
        <HotkeyButton
          className="h-10 w-10 p-2 border-b border-l absolute top-0 right-0 border-slate-400"
          hotkeys={["Escape"]}
          onClick={() => leaveGame()}
        >
          <XShape className="h-full w-full fill-slate-400" />
        </HotkeyButton>
        <h2 className="text-xl">{game.name}</h2>
        <h4 className="text-slate-400">{formatGameMode(game.mode) + " game"}</h4>
      </div>
      {playerDisplays.map((item) => (
        <div className="h-10 bg-slate-700">{item}</div>
      ))}
    </div>
  );
}

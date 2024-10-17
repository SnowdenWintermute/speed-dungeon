import HotkeyButton from "@/app/components/atoms/HotkeyButton";
import { websocketConnection } from "@/singletons/websocket-connection";
import {
  BASE_SCREEN_SIZE,
  ClientToServerEvent,
  GOLDEN_RATIO,
  SpeedDungeonGame,
  SpeedDungeonPlayer,
  formatGameMode,
} from "@speed-dungeon/common";
import React, { useEffect, useState } from "react";
import XShape from "../../../../public/img/basic-shapes/x-shape.svg";
import { useGameStore } from "@/stores/game-store";
import { useLobbyStore } from "@/stores/lobby-store";
import SelectDropdown from "@/app/components/atoms/SelectDropdown";

export default function ProgressionGameLobby({ game }: { game: SpeedDungeonGame }) {
  const [playerDisplays, setPlayerDisplays] = useState<(SpeedDungeonPlayer | null)[]>([]);

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
    const playerSlots: (SpeedDungeonPlayer | null)[] = [];
    const players = Object.values(game.players);
    for (let i = 0; i < 3; i += 1) {
      const player = players[i];
      if (player) playerSlots.push(player);
      else playerSlots.push(null);
    }

    setPlayerDisplays(playerSlots);
  }, [playerNamesConcat]);

  console.log("playerNamesConcat", playerNamesConcat);

  return (
    <div className="w-full h-full flex">
      <div className="flex flex-col">
        <div
          id="game-title-container"
          className="p-2 border-slate-400 border bg-slate-700 h-fit relative pointer-events-auto mb-4"
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
        {
          <ul className="w-full flex flex-col">
            {playerDisplays.map((playerOption, i) => (
              <PlayerDisplay
                playerOption={playerOption}
                game={game}
                key={playerOption?.username || i}
              />
            ))}
          </ul>
        }
      </div>
    </div>
  );
}

function PlayerDisplay({
  playerOption,
  game,
}: {
  playerOption: null | SpeedDungeonPlayer;
  game: SpeedDungeonGame;
}) {
  const username = useGameStore().username;
  const savedCharacters = useLobbyStore().savedCharacters;
  const isControlledByUser = username === playerOption?.username;

  const selectedCharacterId = playerOption?.characterIds[0];
  function changeSelectedCharacterId(entityId: string) {
    websocketConnection.emit(ClientToServerEvent.SelectSavedCharacterForProgressGame, entityId);
  }

  const readyText = playerOption
    ? game.playersReadied.includes(playerOption.username || "")
      ? "Ready"
      : "Selecting character"
    : "";

  return (
    <div className="w-full mb-2 flex flex-col">
      <div className="flex justify-between mb-1">
        <div className="pointer-events-auto">{playerOption?.username || "Empty slot"}</div>
        <div className="pointer-events-auto">{readyText}</div>
      </div>
      {isControlledByUser ? (
        <SelectDropdown
          title={"character-select"}
          value={selectedCharacterId}
          setValue={(value: string) => {
            changeSelectedCharacterId(value);
          }}
          options={Object.values(savedCharacters)
            .filter((character) => !!character)
            .map((character) => {
              return {
                title: `${character!.entityProperties.name}`,
                value: character!.entityProperties.id,
              };
            })}
          disabled={undefined}
        />
      ) : (
        <div
          className={`h-10 w-full pl-2 border border-slate-400 bg-slate-700 flex
                    justify-between items-center pointer-events-auto ${!playerOption && "opacity-50"}`}
        >
          {!playerOption ? "Awaiting player..." : "Their selected character"}
        </div>
      )}
    </div>
  );
}

import { websocketConnection } from "@/singletons/websocket-connection";
import {
  BASE_SCREEN_SIZE,
  ClientToServerEvent,
  Combatant,
  GOLDEN_RATIO,
  MAX_PARTY_SIZE,
  SpeedDungeonGame,
  SpeedDungeonPlayer,
  formatCombatantClassName,
  getProgressionGamePartyName,
} from "@speed-dungeon/common";
import React, { useEffect } from "react";
import { useGameStore } from "@/stores/game-store";
import { useLobbyStore } from "@/stores/lobby-store";
import SelectDropdown from "@/app/components/atoms/SelectDropdown";
import SavedCharacterDisplay from "../saved-character-manager/SavedCharacterDisplay";
import Divider from "@/app/components/atoms/Divider";
import GameLobby from "./GameLobby";

export default function ProgressionGameLobby({ game }: { game: SpeedDungeonGame }) {
  const username = useGameStore().username;

  useEffect(() => {
    websocketConnection.emit(ClientToServerEvent.GetSavedCharactersList);
  }, []);

  const numPlayersInGame = Object.values(game.players).length;
  const menuWidth = Math.floor(BASE_SCREEN_SIZE * Math.pow(GOLDEN_RATIO, 3));

  return (
    <GameLobby game={game}>
      <div style={{ width: `${menuWidth}px` }}>
        <ul className="w-full flex flex-col">
          {Object.values(game.players).map((player, i) => (
            <PlayerDisplay playerOption={player} game={game} index={i} key={player.username} />
          ))}
          {new Array(MAX_PARTY_SIZE - numPlayersInGame).fill(null).map((_item, i) => (
            <PlayerDisplay playerOption={null} game={game} index={i + numPlayersInGame} key={i} />
          ))}
        </ul>
        <Divider />
        <div className="text-lg mb-2">Starting on floor: max {game.selectedStartingFloor.max}</div>
        <SelectDropdown
          title={"starting-floor-select"}
          value={game.selectedStartingFloor.current}
          setValue={(value: number) => {
            websocketConnection.emit(ClientToServerEvent.SelectProgressionGameStartingFloor, value);
          }}
          options={Array.from({ length: game.selectedStartingFloor.max }, (_, index) => ({
            title: `Floor ${index + 1}`,
            value: index + 1,
          }))}
          disabled={Object.values(game.players)[0]?.username !== username}
        />
      </div>
    </GameLobby>
  );
}

function PlayerDisplay({
  playerOption,
  game,
  index,
}: {
  playerOption: null | SpeedDungeonPlayer;
  game: SpeedDungeonGame;
  index: number;
}) {
  const username = useGameStore().username;
  const savedCharacters = useLobbyStore().savedCharacters;
  const isControlledByUser = username === playerOption?.username;

  const partyName = getProgressionGamePartyName(game.name);
  const partyOption = game.adventuringParties[partyName];
  if (!partyOption) return <div>Progression default party not found</div>;

  let selectedCharacterOption: null | Combatant = null;
  if (playerOption !== null) {
    const characterId = playerOption.characterIds[0];
    if (characterId === undefined) return <div></div>;
    const selectedCharacter = partyOption.characters[characterId];
    if (selectedCharacter === undefined) return <div></div>;
    selectedCharacterOption = selectedCharacter;
  }

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
      {selectedCharacterOption && (
        <SavedCharacterDisplay
          character={selectedCharacterOption}
          index={index}
          key={selectedCharacterOption.entityProperties.id}
        >
          <div className="h-full w-full flex flex-col items-center justify-end text-lg ">
            <div className="h-fit flex flex-col items-center text-nowrap absolute bottom-0">
              <div className="text-xl">{selectedCharacterOption.entityProperties.name}</div>
              <div className="text-base">
                {formatCharacterLevelAndClass(selectedCharacterOption)}
              </div>
            </div>
          </div>
        </SavedCharacterDisplay>
      )}
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
                title: formatCharacterTag(character!.combatant),
                value: character!.combatant.entityProperties.id,
              };
            })}
          disabled={game.playersReadied.includes(username)}
        />
      ) : (
        <div
          className={`h-10 w-full pl-2 border border-slate-400 bg-slate-700 flex
                     justify-between items-center pointer-events-auto ${!playerOption && "opacity-50"}`}
        >
          {selectedCharacterOption
            ? formatCharacterTag(selectedCharacterOption)
            : "Awaiting player..."}
        </div>
      )}
    </div>
  );
}

export function formatCharacterTag(combatant: Combatant) {
  const deadText = combatant.combatantProperties.hitPoints <= 0 ? " - DEAD" : "";
  return `${combatant.entityProperties.name} - ${formatCharacterLevelAndClass(combatant)}${deadText}`;
}

export function formatCharacterLevelAndClass(combatant: Combatant) {
  return `level ${combatant.combatantProperties.level} ${formatCombatantClassName(combatant.combatantProperties.combatantClass)}`;
}

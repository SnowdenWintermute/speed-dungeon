import {
  BASE_SCREEN_SIZE,
  COMBATANT_CLASS_NAME_STRINGS,
  ClientIntentType,
  Combatant,
  CombatantId,
  GOLDEN_RATIO,
  MAX_PARTY_SIZE,
  SpeedDungeonGame,
  SpeedDungeonPlayer,
  Username,
  getProgressionGamePartyName,
} from "@speed-dungeon/common";
import React, { useEffect, useMemo } from "react";
import { SelectDropdown } from "@/app/components/atoms/SelectDropdown";
import Divider from "@/app/components/atoms/Divider";
import { GameLobby } from "./GameLobby";
import { CharacterModelDisplay } from "@/app/character-model-display";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";

export const ProgressionGameLobby = observer(() => {
  const { session, gameContext, lobbyClientRef } = useClientApplication();
  const username = session.requireUsername();
  const game = gameContext.requireGame();
  if (game === null) return <div>Loading...</div>;

  useEffect(() => {
    lobbyClientRef
      .get()
      .dispatchIntent({ type: ClientIntentType.GetSavedCharactersList, data: undefined });
  }, []);

  const numPlayersInGame = useMemo(() => game.players.size, [game.players]);

  const menuWidth = Math.floor(BASE_SCREEN_SIZE * Math.pow(GOLDEN_RATIO, 3));

  // potential meaning the deepest floor any character could select
  let potentialMaxStartingFloor = 1;
  for (const floorNumber of Object.values(game.lowestStartingFloorOptionsBySavedCharacter)) {
    if (floorNumber > potentialMaxStartingFloor) potentialMaxStartingFloor = floorNumber;
  }

  // true max starting floor is the deepest that all selected have reached
  const maxStartingFloor = game.getMaxStartingFloor();

  useEffect(() => {
    if (game.selectedStartingFloor > maxStartingFloor) {
      game.selectedStartingFloor = maxStartingFloor;
    }
  }, [maxStartingFloor, game.selectedStartingFloor, game.players, game]);

  return (
    <GameLobby>
      <div style={{ width: `${menuWidth}px` }}>
        <ul className="w-full flex flex-col">
          {Array.from(game.players).map(([username, player], i) => (
            <PlayerDisplay playerOption={player} game={game} index={i} key={player.username} />
          ))}
          {new Array(MAX_PARTY_SIZE - numPlayersInGame).fill(null).map((_item, i) => (
            <PlayerDisplay playerOption={null} game={game} index={i + numPlayersInGame} key={i} />
          ))}
        </ul>
        <Divider />
        <div className="text-lg mb-2 flex justify-between">
          <span>Selected Starting floor</span>
          <span> (max {maxStartingFloor})</span>
        </div>
        <SelectDropdown
          title={"starting-floor-select"}
          value={game.selectedStartingFloor}
          setValue={(value: number) => {
            lobbyClientRef.get().dispatchIntent({
              type: ClientIntentType.SelectProgressionGameStartingFloor,
              data: { floorNumber: value },
            });
          }}
          options={Array.from({ length: potentialMaxStartingFloor }, (_, index) => ({
            title: `Floor ${index + 1}`,
            value: index + 1,
            disabled: index + 1 > maxStartingFloor,
          }))}
          disabled={Array.from(game.players)[0]?.[1].username !== username}
        />
      </div>
    </GameLobby>
  );
});

const PlayerDisplay = observer(
  ({
    playerOption,
    game,
  }: {
    playerOption: null | SpeedDungeonPlayer;
    game: SpeedDungeonGame;
    index: number;
  }) => {
    const { session, lobbyContext, lobbyClientRef } = useClientApplication();
    const username = session.requireUsername();
    const savedCharacters = lobbyContext.savedCharacters.slots;
    const isControlledByUser = username === playerOption?.username;

    const partyName = getProgressionGamePartyName(game.name);
    const partyOption = game.adventuringParties.get(partyName);
    if (!partyOption) return <div>Progression default party not found</div>;

    let selectedCharacterOption: null | Combatant = null;
    if (playerOption !== null) {
      const characterId = playerOption.characterIds[0];
      if (characterId === undefined) return <div></div>;
      const selectedCharacter = partyOption.combatantManager.getCombatantOption(characterId);
      if (selectedCharacter === undefined) return <div></div>;
      selectedCharacterOption = selectedCharacter;
    }

    const selectedCharacterId = playerOption?.characterIds[0];

    function changeSelectedCharacterId(entityId: CombatantId) {
      lobbyClientRef.get().dispatchIntent({
        type: ClientIntentType.SelectSavedCharacterForProgressGame,
        data: { entityId },
      });
    }

    const readyText = playerOption
      ? game.playersReadied.includes(playerOption.username || ("" as Username))
        ? "Ready"
        : "Selecting character"
      : "";

    return (
      <div className="w-full mb-2 flex flex-col">
        {selectedCharacterOption && (
          <CharacterModelDisplay
            character={selectedCharacterOption}
            key={selectedCharacterOption.entityProperties.id}
          >
            <div className="h-full w-full flex flex-col items-center justify-end text-lg ">
              <div className="h-fit flex flex-col items-center text-nowrap absolute bottom-0">
                <div className="text-xl">{selectedCharacterOption.entityProperties.name}</div>
                <div className="text-base">
                  {formatCharacterLevelAndClass(selectedCharacterOption)}
                </div>
                <div className="text-base">
                  max floor reached:{" "}
                  {selectedCharacterOption.combatantProperties.deepestFloorReached}
                </div>
              </div>
            </div>
          </CharacterModelDisplay>
        )}
        <div className="flex justify-between mb-1">
          <div className="pointer-events-auto">{playerOption?.username || "Empty slot"}</div>
          <div className="pointer-events-auto">{readyText}</div>
        </div>
        {isControlledByUser ? (
          <SelectDropdown
            title={"character-select"}
            value={selectedCharacterId}
            setValue={(value: CombatantId) => {
              changeSelectedCharacterId(value);
            }}
            options={Object.values(savedCharacters)
              .filter((character) => !!character)
              .map((character) => {
                if (character === null) {
                  throw new Error("unexpected null character");
                }
                return {
                  title: formatCharacterTag(character.combatant),
                  value: character.combatant.entityProperties.id,
                  disabled: character.combatant.combatantProperties.isDead(),
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
);

function formatCharacterTag(combatant: Combatant) {
  const deadText = combatant.combatantProperties.isDead() ? " - DEAD" : "";
  return `${combatant.entityProperties.name} - ${formatCharacterLevelAndClass(combatant)}${deadText}`;
}

function formatCharacterLevelAndClass(combatant: Combatant) {
  const { combatantClass } =
    combatant.combatantProperties.classProgressionProperties.getMainClass();
  return `level ${combatant.getLevel()} ${COMBATANT_CLASS_NAME_STRINGS[combatantClass]}`;
}

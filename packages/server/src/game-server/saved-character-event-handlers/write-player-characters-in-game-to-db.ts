import {
  ERROR_MESSAGES,
  ServerToClientEvent,
  SpeedDungeonGame,
  SpeedDungeonPlayer,
  getPartyChannelName,
  getProgressionGamePartyName,
} from "@speed-dungeon/common";
import { playerCharactersRepo } from "../../database/repos/player-characters.js";
import { GameServer } from "../index.js";

export async function writePlayerCharactersInGameToDb(
  game: SpeedDungeonGame,
  player: SpeedDungeonPlayer
): Promise<Error | void> {
  try {
    if (!player.partyName) throw new Error(ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);
    for (const id of player.characterIds) {
      const characterResult = SpeedDungeonGame.getCombatantById(game, id);

      if (characterResult instanceof Error) {
        throw new Error("Couldn't save character: " + characterResult);
      }

      const existingCharacter = await playerCharactersRepo.findById(
        characterResult.entityProperties.id
      );

      if (!existingCharacter) {
        throw new Error("Tried to update character but it didn't exist in the database");
      }

      characterResult.getTargetingProperties().clear();
      const partyOption = game.adventuringParties[getProgressionGamePartyName(game.name)];
      if (partyOption === undefined) throw new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);

      const floorNumber = partyOption.dungeonExplorationManager.getCurrentFloor();

      if (floorNumber > existingCharacter.combatantProperties.deepestFloorReached) {
        characterResult.combatantProperties.deepestFloorReached = floorNumber;
      }

      existingCharacter.combatantProperties = characterResult.combatantProperties;
      await playerCharactersRepo.update(existingCharacter);
    }
  } catch (error) {
    if (error instanceof Error) return error;
    else {
      console.error(error);
      return new Error(ERROR_MESSAGES.SERVER_GENERIC);
    }
  }
}

export async function writeAllPlayerCharacterInGameToDb(
  gameServer: GameServer,
  game: SpeedDungeonGame
) {
  const promises: Promise<Error | void>[] = [];

  for (const player of Object.values(game.players)) {
    promises.push(writePlayerCharactersInGameToDb(game, player));
  }
  const maybeErrors = await Promise.all(promises);
  for (const maybeError of maybeErrors) {
    if (maybeError instanceof Error) {
      console.error(maybeError);
      gameServer.io
        .in(getPartyChannelName(game.name, getProgressionGamePartyName(game.name)))
        .emit(ServerToClientEvent.ErrorMessage, "Error saving character data");
    }
  }
  return maybeErrors;
}

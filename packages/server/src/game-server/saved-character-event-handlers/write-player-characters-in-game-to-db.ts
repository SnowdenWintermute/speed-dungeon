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

export default async function writePlayerCharactersInGameToDb(
  game: SpeedDungeonGame,
  player: SpeedDungeonPlayer
): Promise<Error | void> {
  try {
    console.log("saving characters for player ", player.username);
    if (!player.partyName) throw new Error(ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);
    for (const id of player.characterIds) {
      const characterResult = SpeedDungeonGame.getCharacter(game, player.partyName, id);
      if (characterResult instanceof Error)
        throw new Error("Couldn't save character: " + characterResult);
      const existingCharacter = await playerCharactersRepo.findById(
        characterResult.entityProperties.id
      );
      if (!existingCharacter)
        throw new Error("Tried to update character but it didn't exist in the database");
      characterResult.combatantProperties.selectedCombatAction = null;
      characterResult.combatantProperties.combatActionTarget = null;
      const partyOption = game.adventuringParties[getProgressionGamePartyName(game.name)];
      if (partyOption === undefined) throw new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
      if (partyOption.currentFloor > existingCharacter.deepestFloorReached)
        existingCharacter.deepestFloorReached = partyOption.currentFloor;

      existingCharacter.combatantProperties = characterResult.combatantProperties;
      await playerCharactersRepo.update(existingCharacter);
      console.log("initiated character update transaction for ", existingCharacter.name);
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

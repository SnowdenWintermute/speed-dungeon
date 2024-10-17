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
    for (const id of player.characterIds) {
      if (!player.partyName) return new Error(ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);
      const characterResult = SpeedDungeonGame.getCharacter(game, player.partyName, id);
      if (characterResult instanceof Error)
        return new Error("Couldn't save character: " + characterResult);
      else {
        const existingCharacter = await playerCharactersRepo.findById(
          characterResult.entityProperties.id
        );
        if (!existingCharacter)
          console.error("Tried to update character but it didn't exist in the database");
        else {
          characterResult.combatantProperties.selectedCombatAction = null;
          characterResult.combatantProperties.combatActionTarget = null;

          existingCharacter.combatantProperties = characterResult.combatantProperties;
          await playerCharactersRepo.update(existingCharacter);
          console.log("initiated character update transaction for ", existingCharacter.name);
        }
      }
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

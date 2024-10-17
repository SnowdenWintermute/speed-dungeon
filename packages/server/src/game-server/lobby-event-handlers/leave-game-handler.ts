import {
  GameMode,
  LOBBY_CHANNEL,
  ServerToClientEvent,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { GameServer } from "../index.js";
import errorHandler from "../error-handler.js";
import { playerCharactersRepo } from "../../database/repos/player-characters.js";

export default async function leaveGameHandler(this: GameServer, socketId: string) {
  let [socket, socketMeta] = this.getConnection(socketId);
  if (!socketMeta.currentGameName) {
    console.log(
      "Tried to handle a user leaving a game but they didn't know what game they were in"
    );
    return;
  }
  const game = this.games.get(socketMeta.currentGameName);
  if (!game)
    return errorHandler(
      socket,
      "Tried handle a user leaving a game but the game they thought they were in didn't exist"
    );

  // save their characters
  const playerOption = game.players[socketMeta.username];
  if (playerOption && playerOption.partyName && game.mode === GameMode.Progression) {
    console.log("saving characters");
    for (const id of playerOption.characterIds) {
      const characterResult = SpeedDungeonGame.getCharacter(game, playerOption.partyName, id);
      if (characterResult instanceof Error)
        console.error("Couldn't save character: " + characterResult);
      else {
        const existingCharacter = await playerCharactersRepo.findById(
          characterResult.entityProperties.id
        );
        if (!existingCharacter)
          console.error("Tried to update character but it didn't exist in the database");
        else {
          existingCharacter.combatantProperties = characterResult.combatantProperties;
          await playerCharactersRepo.update(existingCharacter);
          console.log("initiated character update transaction for ", existingCharacter.name);
        }
      }
    }
  }

  this.leavePartyHandler(socketId);
  if (!game)
    return errorHandler(
      socket,
      "Tried handle a user leaving a game but the game they thought they were in didn't exist"
    );
  SpeedDungeonGame.removePlayer(game, socketMeta.username);
  const gameNameLeaving = socketMeta.currentGameName;
  socketMeta.currentGameName = null;
  if (Object.keys(game.players).length === 0) this.games.remove(game.name);

  this.removeSocketFromChannel(socketId, gameNameLeaving);
  this.joinSocketToChannel(socketId, LOBBY_CHANNEL);

  if (this.games.get(gameNameLeaving)) {
    this.io
      .of("/")
      .in(gameNameLeaving)
      .emit(ServerToClientEvent.PlayerLeftGame, socketMeta.username);
  }
  socket?.emit(ServerToClientEvent.GameFullUpdate, null);
}

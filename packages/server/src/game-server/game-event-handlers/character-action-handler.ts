import {
  AdventuringParty,
  ClientToServerEventTypes,
  ERROR_MESSAGES,
  ServerToClientEventTypes,
  SpeedDungeonGame,
  CharacterAssociatedData,
} from "@speed-dungeon/common";
import { GameServer } from "../index.js";
import { BrowserTabSession } from "../socket-connection-metadata.js";

export default function characterActionHandler(
  this: GameServer,
  socketId: string,
  characterId: string,
  fn: (
    socketMeta: BrowserTabSession,
    characterAssociatedData: CharacterAssociatedData
  ) => Error | void
): Error | void {
  const [socket, socketMeta] = this.getConnection<
    ClientToServerEventTypes,
    ServerToClientEventTypes
  >(socketId);
  if (!socket) return new Error(ERROR_MESSAGES.SERVER.SOCKET_NOT_FOUND);

  const gameResult = this.getSocketCurrentGame(socketMeta);
  if (gameResult instanceof Error) return gameResult;
  const game = gameResult;
  const partyResult = SpeedDungeonGame.getPlayerParty(game, socketMeta.username);
  if (partyResult instanceof Error) return partyResult;
  const party = partyResult;
  const playerOption = game.players[socketMeta.username];
  if (playerOption === undefined) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
  const player = playerOption;

  const characterResult = AdventuringParty.getCharacterIfOwned(
    party,
    player.characterIds,
    characterId
  );
  if (characterResult instanceof Error) return characterResult;
  const character = characterResult;

  if (character.combatantProperties.hitPoints <= 0) {
    return new Error(
      `${ERROR_MESSAGES.COMBATANT.IS_DEAD} ID: ${characterResult.entityProperties.id}`
    );
  }

  return fn(socketMeta, { username: socketMeta.username, character, party, game });
}

import {
  ClientToServerEventTypes,
  ERROR_MESSAGES,
  ServerToClientEvent,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { GameServer } from "../index.js";
import { generateRandomPartyName } from "../../utils/index.js";
import { AdventuringParty } from "@speed-dungeon/common";
import errorHandler from "../error-handler.js";

export default function createPartyHandler(this: GameServer, socketId: string, partyName: string) {
  const [socket, socketMeta] = this.getConnection<
    ClientToServerEventTypes,
    ServerToClientEventTypes
  >(socketId);

  if (!socketMeta.currentGameName)
    return errorHandler(
      socket,
      "A client tried to create a party but they didn't know what game they were in"
    );
  const game = this.games.get(socketMeta.currentGameName);
  if (!game)
    return errorHandler(
      socket,
      "A client tried to create a party but their supposed game didn't exist"
    );
  const player = game.players[socketMeta.username];
  if (!player)
    return errorHandler(
      socket,
      "A client tried to create a party but their game didn't include them in the player list"
    );

  if (player.partyName)
    return socket?.emit(ServerToClientEvent.ErrorMessage, ERROR_MESSAGES.LOBBY.ALREADY_IN_PARTY);

  if (partyName === "") {
    partyName = generateRandomPartyName();
  }
  if (game.adventuringParties[partyName]) {
    return socket?.emit(ServerToClientEvent.ErrorMessage, ERROR_MESSAGES.LOBBY.PARTY_NAME_EXISTS);
  }
  game.adventuringParties[partyName] = new AdventuringParty(partyName);
  this.io.of("/").in(game.name).emit(ServerToClientEvent.PartyCreated, partyName);
  this.joinPartyHandler(socketId, partyName);
}

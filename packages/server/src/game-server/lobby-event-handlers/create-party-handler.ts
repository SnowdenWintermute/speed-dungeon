import { ERROR_MESSAGES, ServerToClientEvent, SocketNamespaces } from "@speed-dungeon/common";
import { GameServer } from "..";
import { generateRandomPartyName } from "../../utils";
import { AdventuringParty } from "@speed-dungeon/common";

export default function createPartyHandler(this: GameServer, socketId: string, partyName: string) {
  const [socket, socketMeta] = this.getConnection(socketId, SocketNamespaces.Main);
  if (!socketMeta.currentGameName)
    throw new Error("A client tried to create a party but they didn't know what game they were in");
  const game = this.games.get(socketMeta.currentGameName);
  if (!game)
    throw new Error("A client tried to create a party but their supposed game didn't exist");
  const player = game.players[socketMeta.username];
  if (!player)
    throw new Error(
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
  this.io.of(SocketNamespaces.Main).in(game.name).emit(ServerToClientEvent.PartyCreated, partyName);
  this.joinPartyHandler(socketId, partyName);
}
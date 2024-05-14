import { ERROR_MESSAGES, ServerToClientEvent, SocketNamespaces } from "@speed-dungeon/common";
import { GameServer } from "..";
import { generateRandomPartyName } from "../../utils";
import { AdventuringParty } from "@speed-dungeon/common";

export default function createPartyHandler(this: GameServer, socketId: string, partyName: string) {
  const [_, socketMeta] = this.getConnection(socketId, SocketNamespaces.Main);
  if (!socketMeta.currentGameName)
    throw new Error("A client tried to create a party but they didn't know what game they were in");
  const game = this.games.get(socketMeta.currentGameName);
  if (!game)
    throw new Error("A client tried to create a party but their supposed game didn't exist");
  const player = game.players.get(socketMeta.username);
  if (!player)
    throw new Error(
      "A client tried to create a party but their game didn't include them in the player list"
    );

  if (player.partyName) throw new Error(ERROR_MESSAGES.LOBBY.ALREADY_IN_PARTY);
  if (partyName === "") {
    partyName = generateRandomPartyName();
  }
  if (game.adventuringParties.has(partyName))
    throw new Error(ERROR_MESSAGES.LOBBY.PARTY_NAME_EXISTS);

  game.adventuringParties.set(partyName, new AdventuringParty(partyName));

  this.io.of(SocketNamespaces.Main).in(game.name).emit(ServerToClientEvent.PartyCreated, partyName);
}

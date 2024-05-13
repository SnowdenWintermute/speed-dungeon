import { ERROR_MESSAGES, ServerToClientEvent, SocketNamespaces } from "@speed-dungeon/common";
import { GameServer } from "..";

export default function joinPartyHandler(this: GameServer, socketId: string, partyName: string) {
  const [socket, socketMeta] = this.getConnection(socketId, SocketNamespaces.Main);
  if (!socketMeta.currentGameName)
    throw new Error("A client tried to join a party but they didn't know their own game name");
  const game = this.games.get(socketMeta.currentGameName);
  if (!game) throw new Error("A client tried to join a party but their supposed game didn't exist");
  const player = game.players.get(socketMeta.username);
  if (!player)
    throw new Error(
      "A client tried to join a party but their game didn't include them in the player list"
    );
  if (player.partyName) throw new Error(ERROR_MESSAGES.LOBBY.ALREADY_IN_PARTY);

  game.putPlayerInParty(partyName, player.username);
  this.joinSocketToChannel(socketId, SocketNamespaces.Party, partyName);
  socket?.emit(ServerToClientEvent.PartyNameUpdate, partyName);

  this.io
    .of(SocketNamespaces.Main)
    .to(game.name)
    .emit(ServerToClientEvent.PlayerChangedAdventuringParty, socketMeta.username, partyName);
}

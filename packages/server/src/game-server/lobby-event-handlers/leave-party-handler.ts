import { SocketNamespaces } from "@speed-dungeon/common";
import { GameServer } from "..";

export default function leavePartyHandler(this: GameServer, socketId: string) {
  const [socket, socketMeta] = this.getConnection(
    socketId,
    SocketNamespaces.Main
  );
  if (!socketMeta.currentGameName) return;
  const game = this.games.get(socketMeta.currentGameName);
  if (!game) throw new Error("No game exists");
  const partyNameLeaving = game.removePlayerFromParty(socketMeta.username);
  // const partyName = party.removePlayer(username)
  // this.removeSocketFromChannel(socketId, SocketNamespaces.Party, partyName)
  // emit to the socket that their party is now undefined
  // emit to the game that a player changed adventuring parties (player: username, partyName: undefined)
}

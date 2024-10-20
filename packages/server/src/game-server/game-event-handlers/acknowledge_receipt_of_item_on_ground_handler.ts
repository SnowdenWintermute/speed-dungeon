import {
  ClientToServerEventTypes,
  ERROR_MESSAGES,
  ServerToClientEventTypes,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { getGameServer } from "../../index.js";
import { Socket } from "socket.io";

export default function acknowledgeReceiptOfItemOnGroundHandler(
  itemId: string,
  socket: Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  const gameServer = getGameServer();
  const [_socket, socketMeta] = gameServer.getConnection<
    ClientToServerEventTypes,
    ServerToClientEventTypes
  >(socket.id);
  if (!socket) return new Error(ERROR_MESSAGES.SERVER.SOCKET_NOT_FOUND);

  const gameResult = gameServer.getSocketCurrentGame(socketMeta);
  if (gameResult instanceof Error) return new Error(gameResult.message);
  const game = gameResult;
  const partyResult = SpeedDungeonGame.getPlayerPartyOption(gameResult, socketMeta.username);
  if (partyResult instanceof Error) return new Error(partyResult.message);
  if (partyResult === undefined) return new Error(ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);
  const party = partyResult;
  const receivedBy = party.itemsOnGroundNotYetReceivedByAllClients[itemId];
  if (receivedBy === undefined)
    return new Error(ERROR_MESSAGES.ITEM.ACKNOWLEDGEMENT_SENT_BEFORE_ITEM_EXISTED);

  receivedBy.push(socketMeta.username);

  let allUsersInPartyHaveReceivedItemUpdate = true;

  for (const username of party.playerUsernames) {
    const playerOption = game.players[username];
    if (playerOption === undefined) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
    if (!receivedBy.includes(username)) {
      allUsersInPartyHaveReceivedItemUpdate = false;
      break;
    }
  }

  if (allUsersInPartyHaveReceivedItemUpdate)
    delete party.itemsOnGroundNotYetReceivedByAllClients[itemId];
}

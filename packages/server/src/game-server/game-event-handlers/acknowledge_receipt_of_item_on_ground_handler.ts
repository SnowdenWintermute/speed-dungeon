import {
  ClientToServerEventTypes,
  ERROR_MESSAGES,
  ServerToClientEventTypes,
  getPlayerParty,
} from "@speed-dungeon/common";
import { GameServer } from "../index.js";

export default function acknowledgeReceiptOfItemOnGroundHandler(
  this: GameServer,
  socketId: string,
  itemId: string
) {
  const [socket, socketMeta] = this.getConnection<
    ClientToServerEventTypes,
    ServerToClientEventTypes
  >(socketId);
  if (!socket) return new Error(ERROR_MESSAGES.SERVER.SOCKET_NOT_FOUND);

  const gameResult = this.getSocketCurrentGame(socketMeta);
  if (gameResult instanceof Error) return new Error(gameResult.message);
  const game = gameResult;
  const partyResult = getPlayerParty(gameResult, socketMeta.username);
  if (partyResult instanceof Error) return new Error(partyResult.message);
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

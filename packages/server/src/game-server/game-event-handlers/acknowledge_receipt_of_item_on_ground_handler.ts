import {
  ClientToServerEventTypes,
  ERROR_MESSAGES,
  PlayerAssociatedData,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { Socket } from "socket.io";

export default function acknowledgeReceiptOfItemOnGroundHandler(
  itemId: string,
  playerAssociatedData: PlayerAssociatedData,
  socket?: Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  if (!socket) return new Error(ERROR_MESSAGES.EVENT_MIDDLEWARE.MISSING_SOCKET);
  const { partyOption, player, game } = playerAssociatedData;
  if (!partyOption) return new Error(ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);
  const party = partyOption;

  if (!socket) return new Error(ERROR_MESSAGES.SERVER.SOCKET_NOT_FOUND);

  const receivedBy = party.itemsOnGroundNotYetReceivedByAllClients[itemId];

  if (receivedBy === undefined)
    return new Error(ERROR_MESSAGES.ITEM.ACKNOWLEDGEMENT_SENT_BEFORE_ITEM_EXISTED);

  receivedBy.push(player.username);

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

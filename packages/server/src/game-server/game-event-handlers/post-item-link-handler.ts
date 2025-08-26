import {
  AdventuringParty,
  ERROR_MESSAGES,
  EntityId,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { ServerPlayerAssociatedData } from "../event-middleware/index.js";
import { Socket } from "socket.io";
import { getGameServer } from "../../singletons/index.js";

export function postItemLinkHandler(
  itemId: EntityId,
  playerAssociatedData: ServerPlayerAssociatedData,
  _socket: Socket
) {
  const gameServer = getGameServer();
  const { game, partyOption, session } = playerAssociatedData;
  if (!partyOption) return new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
  const itemInPartyResult = AdventuringParty.getItem(partyOption, itemId);
  if (itemInPartyResult instanceof Error) return itemInPartyResult;

  gameServer.io
    .to(getPartyChannelName(game.name, partyOption.name))
    .emit(ServerToClientEvent.PlayerPostedItemLink, {
      username: session.username,
      itemId: itemInPartyResult.entityProperties.id,
    });
}

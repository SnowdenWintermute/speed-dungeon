import { ERROR_MESSAGES, ServerToClientEvent } from "@speed-dungeon/common";
import { generateRandomPartyName } from "../../utils/index.js";
import { AdventuringParty } from "@speed-dungeon/common";
import joinPartyHandler from "./join-party-handler.js";
import { ServerPlayerAssociatedData } from "../event-middleware/index.js";
import { getGameServer } from "../../index.js";
import { Socket } from "socket.io";

export default function createPartyHandler(
  partyName: string,
  playerAssociatedData: ServerPlayerAssociatedData,
  socket?: Socket
) {
  if (!socket) return new Error(ERROR_MESSAGES.EVENT_MIDDLEWARE.MISSING_SOCKET);
  const { player, game } = playerAssociatedData;

  if (player.partyName) return new Error(ERROR_MESSAGES.LOBBY.ALREADY_IN_PARTY);

  if (partyName === "") partyName = generateRandomPartyName();

  if (game.adventuringParties[partyName]) return new Error(ERROR_MESSAGES.LOBBY.PARTY_NAME_EXISTS);

  game.adventuringParties[partyName] = new AdventuringParty(partyName);
  getGameServer().io.of("/").in(game.name).emit(ServerToClientEvent.PartyCreated, partyName);
  joinPartyHandler(partyName, playerAssociatedData);
}

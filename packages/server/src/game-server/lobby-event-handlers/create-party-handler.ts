import { ERROR_MESSAGES, MAX_PARTY_NAME_LENGTH, ServerToClientEvent } from "@speed-dungeon/common";
import { generateRandomPartyName } from "../../utils/index.js";
import { AdventuringParty } from "@speed-dungeon/common";
import joinPartyHandler from "./join-party-handler.js";
import { ServerPlayerAssociatedData } from "../event-middleware/index.js";
import { getGameServer } from "../../index.js";
import { Socket } from "socket.io";

export default function createPartyHandler(
  partyName: string,
  playerAssociatedData: ServerPlayerAssociatedData,
  socket: Socket
) {
  const { player, game } = playerAssociatedData;

  if (player.partyName) return new Error(ERROR_MESSAGES.LOBBY.ALREADY_IN_PARTY);

  if (partyName.length > MAX_PARTY_NAME_LENGTH)
    return new Error(`Party names may be no longer than ${MAX_PARTY_NAME_LENGTH} characters`);
  if (partyName === "") partyName = generateRandomPartyName();

  if (game.adventuringParties[partyName]) return new Error(ERROR_MESSAGES.LOBBY.PARTY_NAME_EXISTS);

  game.adventuringParties[partyName] = new AdventuringParty(partyName);
  getGameServer().io.of("/").in(game.name).emit(ServerToClientEvent.PartyCreated, partyName);
  joinPartyHandler(partyName, playerAssociatedData, socket);
}

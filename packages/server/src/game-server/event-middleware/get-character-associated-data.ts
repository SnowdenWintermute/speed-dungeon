import {
  ClientToServerEventTypes,
  ERROR_MESSAGES,
  ServerToClientEventTypes,
  CharacterAssociatedData,
} from "@speed-dungeon/common";
import { SocketEventNextFunction } from "./index.js";
import { getGameServer } from "../../singletons/index.js";
import { Socket } from "socket.io";

export async function getCharacterAssociatedData<
  T extends { characterId: string; allowSummonedPets?: boolean },
>(
  socket: Socket<ClientToServerEventTypes, ServerToClientEventTypes>,
  eventData: T,
  _middlewareProvidedData: CharacterAssociatedData | undefined,
  next: SocketEventNextFunction<T, CharacterAssociatedData>
) {
  const gameServer = getGameServer();
  const [_socket, socketMeta] = gameServer.getConnection<
    ClientToServerEventTypes,
    ServerToClientEventTypes
  >(socket.id);

  const gameResult = gameServer.getSocketCurrentGame(socketMeta);

  if (gameResult instanceof Error) throw gameResult;
  const game = gameResult;
  const partyResult = game.getPlayerPartyOption(socketMeta.username);
  if (partyResult instanceof Error) throw partyResult;
  if (partyResult === undefined) throw new Error(ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);
  const party = partyResult;
  const player = game.getExpectedPlayer(socketMeta.username);

  const characterResult = party.combatantManager.getCharacterIfOwned(
    player.username,
    eventData.characterId,
    { allowSummonedPets: eventData.allowSummonedPets }
  );
  if (characterResult instanceof Error) throw characterResult;

  next(eventData, { player, character: characterResult, game, party });
}

import {
  AdventuringParty,
  ClientToServerEventTypes,
  ERROR_MESSAGES,
  ServerToClientEventTypes,
  SpeedDungeonGame,
  CharacterAssociatedData,
} from "@speed-dungeon/common";
import { MiddlewareFn } from "./index.js";
import { getGameServer } from "../../index.js";

export const getCharacterAssociatedData: MiddlewareFn<
  { characterId: string; [key: string]: any },
  CharacterAssociatedData
> = async (socket, eventData, _middlewareProvidedData, next) => {
  const gameServer = getGameServer();
  const [_socket, socketMeta] = gameServer.getConnection<
    ClientToServerEventTypes,
    ServerToClientEventTypes
  >(socket.id);

  const gameResult = gameServer.getSocketCurrentGame(socketMeta);

  if (gameResult instanceof Error) throw gameResult;
  const game = gameResult;
  const partyResult = SpeedDungeonGame.getPlayerPartyOption(game, socketMeta.username);
  if (partyResult instanceof Error) throw partyResult;
  if (partyResult === undefined) throw new Error(ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);
  const party = partyResult;
  const playerOption = game.players[socketMeta.username];
  if (playerOption === undefined) throw new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
  const player = playerOption;

  const characterResult = AdventuringParty.getCharacterIfOwned(
    party,
    player.characterIds,
    eventData.characterId
  );
  if (characterResult instanceof Error) throw characterResult;

  next(eventData, { player, character: characterResult, game, party });
};

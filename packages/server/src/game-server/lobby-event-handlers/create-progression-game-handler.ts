import {
  AdventuringParty,
  ClientToServerEventTypes,
  GameMode,
  ServerToClientEventTypes,
  SpeedDungeonGame,
  getProgressionGamePartyName,
} from "@speed-dungeon/common";
import SocketIO from "socket.io";
import { GameServer } from "..";
import errorHandler from "../error-handler.js";
import { BrowserTabSession } from "../socket-connection-metadata.js";
import getDefaultSavedCharacterForProgressionGame from "./get-default-saved-character-for-progression-game.js";
import { joinPlayerToProgressionGame } from "./join-player-to-progression-game.js";
import { idGenerator } from "../../singletons/index.js";

export async function createProgressionGameHandler(
  gameServer: GameServer,
  socketMeta: BrowserTabSession,
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>,
  gameName: string
) {
  const defaultSavedCharacterResult = await getDefaultSavedCharacterForProgressionGame(
    gameServer,
    socketMeta.username,
    socket
  );

  if (defaultSavedCharacterResult instanceof Error)
    return errorHandler(socket, defaultSavedCharacterResult);

  const game = new SpeedDungeonGame(
    idGenerator.generate(),
    gameName,
    GameMode.Progression,
    socketMeta.username
  );
  game.lowestStartingFloorOptionsBySavedCharacter[defaultSavedCharacterResult.entityProperties.id] =
    defaultSavedCharacterResult.combatantProperties.deepestFloorReached;

  game.selectedStartingFloor = defaultSavedCharacterResult.combatantProperties.deepestFloorReached;

  const defaultPartyName = getProgressionGamePartyName(game.name);
  game.adventuringParties[getProgressionGamePartyName(game.name)] = new AdventuringParty(
    idGenerator.generate(),
    defaultPartyName
  );

  gameServer.games.insert(gameName, game);

  await joinPlayerToProgressionGame(
    gameServer,
    socket,
    socketMeta,
    game,
    defaultSavedCharacterResult
  );
}

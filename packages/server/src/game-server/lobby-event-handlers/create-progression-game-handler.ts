import {
  AdventuringParty,
  ClientToServerEventTypes,
  GameMode,
  ServerToClientEventTypes,
  SpeedDungeonGame,
  getProgressionGamePartyName,
} from "@speed-dungeon/common";
import SocketIO from "socket.io";
import { GameServer } from "../index.js";
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
  console.log("creating progression game");
  const defaultSavedCharacterResult = await getDefaultSavedCharacterForProgressionGame(
    gameServer,
    socketMeta.username,
    socket
  );

  if (defaultSavedCharacterResult instanceof Error) {
    console.log("defaultSavedCharacterResult was error");
    return errorHandler(socket, defaultSavedCharacterResult);
  }

  const game = new SpeedDungeonGame(
    idGenerator.generate(),
    gameName,
    GameMode.Progression,
    socketMeta.username
  );
  console.log("created progression game");

  game.lowestStartingFloorOptionsBySavedCharacter[
    defaultSavedCharacterResult.combatant.entityProperties.id
  ] = defaultSavedCharacterResult.combatant.combatantProperties.deepestFloorReached;

  game.selectedStartingFloor =
    defaultSavedCharacterResult.combatant.combatantProperties.deepestFloorReached;

  const defaultPartyName = getProgressionGamePartyName(game.name);

  console.log("creating initialized party");

  game.adventuringParties[getProgressionGamePartyName(game.name)] =
    AdventuringParty.createInitialized(idGenerator.generate(), defaultPartyName);

  gameServer.games.insert(gameName, game);

  console.log("about to joinPlayerToProgressionGame");

  await joinPlayerToProgressionGame(
    gameServer,
    socket,
    socketMeta,
    game,
    defaultSavedCharacterResult
  );
}

import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  SocketNamespaces,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import SocketIO from "socket.io";
import initiateLobbyEventListeners from "./lobby-event-handlers";
import { SocketConnectionMetadata } from "./socket-connection-metadata";
import joinSocketToChannel from "./join-socket-to-channel";
import { connectionHandler } from "./connection-handler";
import disconnectionHandler from "./disconnection-handler";
import removeSocketFromChannel from "./remove-socket-from-channel";
import { HashMap } from "@speed-dungeon/common";
import createGameHandler from "./lobby-event-handlers/create-game-handler";
import getConnection from "./get-connection";
import joinGameHandler from "./lobby-event-handlers/join-game-handler";

// @TODO - performance: change maps and sets to objects
export class GameServer {
  games: HashMap<string, SpeedDungeonGame> = new HashMap();
  socketIdsByUsername: HashMap<string, string[]> = new HashMap();
  connections: HashMap<string, SocketConnectionMetadata> = new HashMap();
  constructor(
    public io: SocketIO.Server<
      ClientToServerEventTypes,
      ServerToClientEventTypes
    >
  ) {
    console.log("constructed game server");
    this.connectionHandler();
  }
  getConnection = getConnection;
  connectionHandler = connectionHandler;
  disconnectionHandler = disconnectionHandler;
  initiateLobbyEventListeners = initiateLobbyEventListeners;
  joinSocketToChannel = joinSocketToChannel;
  removeSocketFromChannel = removeSocketFromChannel;
  createGameHandler = createGameHandler;
  joinGameHandler = joinGameHandler;
}

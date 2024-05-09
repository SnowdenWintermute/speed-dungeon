import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import SocketIO from "socket.io";
import initiateLobbyEventListeners from "./lobby-event-handlers";
import { SocketConnectionMetadata } from "./socket-connection-metadata";
import joinSocketToChannel from "./join-socket-to-channel";
import { connectionHandler } from "./connection-handler";

export class GameServer {
  games: Map<string, SpeedDungeonGame> = new Map();
  socketIdsByUsername: Map<string, string[]> = new Map();
  connections: Map<string, SocketConnectionMetadata> = new Map();
  constructor(
    public io: SocketIO.Server<
      ClientToServerEventTypes,
      ServerToClientEventTypes
    >
  ) {
    console.log("constructed game server");
    this.connectionHandler();
  }
  connectionHandler = connectionHandler;
  initiateLobbyEventListeners = initiateLobbyEventListeners;
  joinSocketToChannel = joinSocketToChannel;
}

import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import SocketIO from "socket.io";
import initiateLobbyEventListeners from "./lobby-event-handlers";

export class GameServer {
  games: { [gameName: string]: SpeedDungeonGame } = {};
  socketIdsByUsername: { [username: string]: string[] } = {};
  constructor(
    public io: SocketIO.Server<
      ClientToServerEventTypes,
      ServerToClientEventTypes
    >
  ) {
    console.log("constructed game server");
    this.io.on("connection", (socket) => {
      console.log("a socket connected", socket.id);
      this.initiateLobbyEventListeners(socket);
    });
  }
  initiateLobbyEventListeners = initiateLobbyEventListeners;
}

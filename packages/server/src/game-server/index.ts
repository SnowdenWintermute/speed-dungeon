import {
  ClientToServerEventTypes,
  ClientToServerEvents,
  ServerToClientEventTypes,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import SocketIO from "socket.io";

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
      socket.on(ClientToServerEvents.RequestToJoinRoom, () => "ay");
      console.log(socket.eventNames());
    });
  }
}

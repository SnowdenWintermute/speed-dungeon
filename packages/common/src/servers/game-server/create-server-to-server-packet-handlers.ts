import {
  ServerToServerPacketType,
  ServerToServerPacketHandlers,
} from "../../packets/server-to-server.js";
import { GameServer } from "./index.js";

export function createGameServerInterServerPacketHandlers(
  gameServer: GameServer
): Partial<ServerToServerPacketHandlers> {
  return {
    [ServerToServerPacketType.GameHandoff]: (data) => {
      // handle the game handoff
    },
  };
}

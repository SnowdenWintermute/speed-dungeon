// import {
//     ServerToServerMessageMap,
//   ServerToServerMessageType,
// } from "../../packets/server-to-server.js";
// import { GameServer } from "./index.js";

// export type GameServerMessageFromLobbyHandler<K extends keyof ServerToServerMessageMap> = (
//   data: ServerToServerMessageMap[K],
//   session: UserSession
// ) => MessageDispatchOutbox<GameStateUpdate> | Promise<MessageDispatchOutbox<GameStateUpdate>>;

// export type LobbyClientIntentHandlers = {
//   [K in keyof ClientIntentMap]: LobbyClientIntentHandler<K>;
// };

// export function createGameServerInterServerMessageHandlers(
//   gameServer: GameServer
// ): Partial<LobbyGameServerMessageHandler> {
//   return {
//     [ServerToServerMessageType.GameHandoff]: (data) => {
//       // handle the game handoff
//     },
//   };
// }

// give the set up game to a GameSimulator either a locally owned GameSimulator

import { SpeedDungeonGame } from "../../../game/index.js";
import { GameServerConnectionInstructions } from "./connection-instructions.js";

// on the client or send it over websockets to a GameServer which owns a GameSimulator
export interface GameHandoffStrategyLobbyToGameServer {
  handoff(game: SpeedDungeonGame): GameServerConnectionInstructions;
}

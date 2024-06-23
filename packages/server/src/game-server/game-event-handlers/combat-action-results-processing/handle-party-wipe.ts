import {
  AdventuringParty,
  Battle,
  ERROR_MESSAGES,
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  SpeedDungeonGame,
  getPlayerParty,
} from "@speed-dungeon/common";
import { GameServer } from "../..";

export default function handlePartyWipe(
  this: GameServer,
  game: SpeedDungeonGame,
  party: AdventuringParty
) {
  const { currentFloor } = party;
  if (party.battleId !== null) delete game.battles[party.battleId];

  const socketIdsOfPlayersInOtherParties = [];
  for (const [username, player] of Object.entries(game.players)) {
    if (party.playerUsernames.includes(username)) continue;
    // socketIdsOfPlayersInOtherParties.push(player)
  }
}

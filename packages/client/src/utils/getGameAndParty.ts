import { AdventuringParty, ERROR_MESSAGES, SpeedDungeonGame } from "@speed-dungeon/common";
import getParty from "./getParty";

export default function getGameAndParty(
  game: null | SpeedDungeonGame,
  username: null | string
): Error | [SpeedDungeonGame, AdventuringParty] {
  if (!game) return new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
  if (!username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
  const party = getParty(game, username);
  if (party instanceof Error) return party;
  return [game, party];
}

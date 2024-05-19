import { AdventuringParty, ERROR_MESSAGES, SpeedDungeonGame } from "@speed-dungeon/common";
import getParty from "./getParty";

export default function getGameAndParty(
  game: null | SpeedDungeonGame,
  username: null | string
): string | [SpeedDungeonGame, AdventuringParty] {
  if (!game) return ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME;
  if (!username) return ERROR_MESSAGES.CLIENT.NO_USERNAME;
  const party = getParty(game, username);
  if (typeof party === "string") return party;
  return [game, party];
}

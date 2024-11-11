import {
  AdventuringParty,
  Combatant,
  ERROR_MESSAGES,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { GameServer } from "../index.js";

export default function getGamePartyAndCombatant(
  this: GameServer,
  gameName: string,
  entityId: string
): Error | { game: SpeedDungeonGame; party: AdventuringParty; combatant: Combatant } {
  const gameOption = this.games.get(gameName);
  if (gameOption === undefined) return new Error(ERROR_MESSAGES.GAME_DOESNT_EXIST);
  const game = gameOption;
  const partyResult = SpeedDungeonGame.getPartyOfCombatant(game, entityId);
  if (partyResult instanceof Error) return partyResult;
  const party = partyResult;
  const combatantResult = AdventuringParty.getCombatant(party, entityId);
  if (combatantResult instanceof Error) return combatantResult;

  return { game, party, combatant: combatantResult };
}

import { SpeedDungeonGame } from ".";
import { AdventuringParty } from "../adventuring_party";
import { CombatantDetails } from "../combatants";
import { ERROR_MESSAGES } from "../errors";

export function getCombatantInGameById(
  game: SpeedDungeonGame,
  entityId: string
): Error | CombatantDetails {
  for (let party of Object.values(game.adventuringParties)) {
    const combatantResult = AdventuringParty.getCombatant(party, entityId);
    if (!(combatantResult instanceof Error)) return combatantResult;
  }

  return new Error(ERROR_MESSAGES.COMBATANT.NOT_FOUND);
}

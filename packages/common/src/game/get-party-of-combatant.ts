import { SpeedDungeonGame } from "./index.js";
import { AdventuringParty } from "../adventuring-party/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";

export default function getPartyOfCombatant(
  game: SpeedDungeonGame,
  combatantId: string
): Error | AdventuringParty {
  for (const party of Object.values(game.adventuringParties)) {
    if (party.characterPositions.includes(combatantId)) return party;
    if (AdventuringParty.getMonsterIds(party).includes(combatantId)) return party;
  }

  return new Error(ERROR_MESSAGES.COMBATANT.NOT_FOUND);
}

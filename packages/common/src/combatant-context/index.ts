import { AdventuringParty } from "../adventuring-party";
import { Battle } from "../battle/index.js";
import { Combatant } from "../combatants/index.js";
import { SpeedDungeonGame } from "../game/index.js";

export class CombatantContext {
  constructor(
    public game: SpeedDungeonGame,
    public party: AdventuringParty,
    public combatant: Combatant
  ) {}

  getOpponents(): Combatant[] {
    const toReturn: Combatant[] = [];
    const battleOption = SpeedDungeonGame.getBattleOption(this.game, this.party.battleId);
    if (!battleOption) return toReturn;
    const result = Battle.getAllyIdsAndOpponentIdsOption(
      battleOption,
      this.combatant.entityProperties.id
    );
    if (result instanceof Error) {
      console.error(result);
      return toReturn;
    }

    const { allyIds, opponentIdsOption } = result;
    if (!opponentIdsOption) return toReturn;

    for (const id of opponentIdsOption) {
      const opponentCombatantResult = AdventuringParty.getCombatant(this.party, id);
      if (opponentCombatantResult instanceof Error) {
        console.error(opponentCombatantResult);
        return toReturn;
      }
      toReturn.push(opponentCombatantResult);
    }

    return toReturn;
  }
}

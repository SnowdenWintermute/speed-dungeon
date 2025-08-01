import { AdventuringParty } from "../adventuring-party/index.js";
import { Battle } from "../battle/index.js";
import { CombatActionTarget } from "../combat/targeting/combat-action-targets.js";
import { Combatant } from "../combatants/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { SpeedDungeonGame } from "../game/index.js";

export class CombatantContext {
  constructor(
    public game: SpeedDungeonGame,
    public party: AdventuringParty,
    public combatant: Combatant
  ) {}

  getBattleOption() {
    if (this.party.battleId === null) return null;
    const expectedBattle = this.game.battles[this.party.battleId];
    if (!expectedBattle) throw new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);
    return expectedBattle;
  }

  getAllyAndOpponentIds() {
    const battleOption = this.getBattleOption();
    if (battleOption === null) return { allyIds: this.party.characterPositions, opponentIds: [] };

    const shimmedConditionUser =
      this.combatant.combatantProperties.asShimmedUserOfTriggeredCondition;

    if (shimmedConditionUser) {
      const targets = this.combatant.combatantProperties.combatActionTarget;
      return Battle.getAllyIdsAndOpponentIdsOptionOfShimmedConditionUser(
        battleOption,
        shimmedConditionUser.entityConditionWasAppliedTo,
        shimmedConditionUser.condition.appliedBy
      );
    }

    const allyAndOponnentIds = Battle.getAllyIdsAndOpponentIdsOption(
      battleOption,
      this.combatant.entityProperties.id
    );
    return allyAndOponnentIds;
  }

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

    const { allyIds, opponentIds } = result;
    if (!opponentIds) return toReturn;

    for (const id of opponentIds) {
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

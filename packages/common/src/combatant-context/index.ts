import { AdventuringParty } from "../adventuring-party/index.js";
import { Battle } from "../battle/index.js";
import { FriendOrFoe } from "../combat/combat-actions/targeting-schemes-and-categories.js";
import { Combatant } from "../combatants/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { SpeedDungeonGame } from "../game/index.js";
import { EntityId } from "../primatives/index.js";

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

  getAllyAndOpponentIds(): Record<FriendOrFoe, EntityId[]> {
    const battleOption = this.getBattleOption();
    if (battleOption === null)
      return { [FriendOrFoe.Friendly]: this.party.characterPositions, [FriendOrFoe.Hostile]: [] };

    const shimmedConditionUser =
      this.combatant.combatantProperties.asShimmedUserOfTriggeredCondition;

    if (shimmedConditionUser) {
      return Battle.getAllyIdsAndOpponentIdsOptionOfShimmedConditionUser(
        battleOption,
        shimmedConditionUser.entityConditionWasAppliedTo,
        shimmedConditionUser.condition.getConditionAppliedBy()
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
    const idsByDisposition = Battle.getAllyIdsAndOpponentIdsOption(
      battleOption,
      this.combatant.entityProperties.id
    );

    for (const id of idsByDisposition[FriendOrFoe.Hostile]) {
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

import { AdventuringParty } from "../adventuring-party/index.js";
import { FriendOrFoe } from "../combat/combat-actions/targeting-schemes-and-categories.js";
import { Combatant } from "../combatants/index.js";
import { SpeedDungeonGame } from "../game/index.js";
import { EntityId } from "../aliases.js";
import { IActionUser } from "./action-user.js";

export class ActionUserContext {
  constructor(
    public game: SpeedDungeonGame,
    public party: AdventuringParty,
    public actionUser: IActionUser
  ) {}

  getBattleOption() {
    if (this.party.battleId === null) {
      return null;
    }
    const expectedBattle = this.game.getExpectedBattle(this.party.battleId);
    return expectedBattle;
  }

  getAllyAndOpponentIds(): Record<FriendOrFoe, EntityId[]> {
    const battleOption = this.getBattleOption();
    return this.actionUser.getAllyAndOpponentIds(this.party, battleOption);
  }
}

export class CombatantContext {
  constructor(
    public game: SpeedDungeonGame,
    public party: AdventuringParty,
    public combatant: Combatant
  ) {}
}

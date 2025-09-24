import { AdventuringParty } from "../adventuring-party/index.js";
import { FriendOrFoe } from "../combat/combat-actions/targeting-schemes-and-categories.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { SpeedDungeonGame } from "../game/index.js";
import { EntityId } from "../primatives/index.js";
import { IActionUser } from "./action-user.js";

export class ActionUserContext {
  constructor(
    public game: SpeedDungeonGame,
    public party: AdventuringParty,
    public actionUser: IActionUser
  ) {}

  getBattleOption() {
    if (this.party.battleId === null) return null;
    const expectedBattle = this.game.battles[this.party.battleId];
    if (!expectedBattle) throw new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);
    return expectedBattle;
  }

  getAllyAndOpponentIds(): Record<FriendOrFoe, EntityId[]> {
    throw new Error("not implemented");
    const battleOption = this.getBattleOption();
    return { [FriendOrFoe.Friendly]: this.party.characterPositions, [FriendOrFoe.Hostile]: [] };
  }
}

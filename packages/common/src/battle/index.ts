import { CombatantTurnTracker } from "../combat/turn-order";
import { EntityId } from "../primatives";
import { getAllyAndEnemyBattleGroups } from "./get-ally-and-enemy-battle-groups";
import getAllyIdsAndOpponentIdsOption from "./get-ally-ids-and-opponent-ids-option";
export * from "./initiate-battle";

export class Battle {
  constructor(
    public id: EntityId,
    public groupA: BattleGroup,
    public groupB: BattleGroup,
    public turnTrackers: CombatantTurnTracker[]
  ) {}

  combatantIsFirstInTurnOrder(combatantId: string) {
    if (this.turnTrackers.length < 1) return false;
    return this.turnTrackers[0]?.entityId === combatantId;
  }

  static getAllyIdsAndOpponentIdsOption = getAllyIdsAndOpponentIdsOption;
  static getAllyAndEnemyBattleGroups = getAllyAndEnemyBattleGroups;
}

export enum BattleGroupType {
  PlayerControlled,
  ComputerControlled,
}

export class BattleGroup {
  constructor(
    public name: string,
    public partyName: EntityId,
    public combatantIds: EntityId[],
    public groupType: BattleGroupType
  ) {}
}

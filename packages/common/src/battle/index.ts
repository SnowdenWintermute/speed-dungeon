import { CombatantTurnTracker } from "../combat/turn-order";
import { EntityId } from "../primatives";
import getAllyIdsAndOpponentIdsOption from "./get-ally-ids-and-opponent-ids-option";

export class Battle {
  constructor(
    public id: EntityId,
    public groupA: BattleGroup,
    public groupB: BattleGroup,
    public turnTrackers: CombatantTurnTracker[]
  ) {}

  combatantIsFirstInTurnOrder(combatantId: string) {
    if (this.turnTrackers.length < 1) return false;
    return this.turnTrackers[0].entityId === combatantId;
  }

  getAllyIdsAndOpponentIdsOption = getAllyIdsAndOpponentIdsOption;
}

export enum BattleGroupType {
  PlayerControlled,
  ComputerControlled,
}

export class BattleGroup {
  constructor(
    public name: string,
    public partyId: EntityId,
    public combatantIds: EntityId[],
    public groupType: BattleGroupType
  ) {}
}

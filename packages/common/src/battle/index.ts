import { EntityId } from "../primatives";

export class Battle {
  constructor(
    public id: EntityId,
    public groupA: BattleGroup,
    public groupB: BattleGroup
  ) {}
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

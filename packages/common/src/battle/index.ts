import { CombatantTurnTracker } from "../combat/turn-order/index.js";
import { EntityId } from "../primatives/index.js";
import { getAllyAndEnemyBattleGroups } from "./get-ally-and-enemy-battle-groups.js";
import getAllyIdsAndOpponentIdsOption from "./get-ally-ids-and-opponent-ids-option.js";

export class Battle {
  constructor(
    public id: EntityId,
    public groupA: BattleGroup,
    public groupB: BattleGroup,
    public turnTrackers: CombatantTurnTracker[]
  ) {}

  static removeCombatantTurnTrackers(battle: Battle, combatantId: string) {
    let indexToRemoveOption = null;
    battle.turnTrackers.forEach((turnTracker, i) => {
      if (turnTracker.entityId === combatantId) {
        indexToRemoveOption = i;
      }
    });
    if (indexToRemoveOption !== null) battle.turnTrackers.splice(indexToRemoveOption, 1);
  }
  static removeCombatant(battle: Battle, combatantId: string) {
    Battle.removeCombatantTurnTrackers(battle, combatantId);
    battle.groupA.combatantIds = battle.groupA.combatantIds.filter((id) => id !== combatantId);
    battle.groupB.combatantIds = battle.groupB.combatantIds.filter((id) => id !== combatantId);
  }

  static combatantIsFirstInTurnOrder(battle: Battle, combatantId: string) {
    if (battle.turnTrackers.length < 1) return false;

    return battle.turnTrackers[0]?.entityId === combatantId;
  }

  static getAllyIdsAndOpponentIdsOption = getAllyIdsAndOpponentIdsOption;
  static getAllyAndEnemyBattleGroups = getAllyAndEnemyBattleGroups;
  static sortTurnTrackers(battle: Battle) {
    battle.turnTrackers.sort((a, b) => {
      if (a.movement > b.movement) return -1;
      if (a.movement < b.movement) return 1;

      if (a.tieBreakerId > b.tieBreakerId) return -1;
      if (a.tieBreakerId < b.tieBreakerId) return 1;

      return 0;
    });
    return battle.turnTrackers;
  }
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

export enum BattleConclusion {
  Defeat,
  Victory,
}

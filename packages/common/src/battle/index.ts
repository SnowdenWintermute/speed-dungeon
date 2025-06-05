import { FriendOrFoe } from "../combat/index.js";
import { endActiveCombatantTurn } from "../combat/turn-order/end-active-combatant-turn.js";
import { CombatantTurnTracker } from "../combat/turn-order/index.js";
import { Combatant, ConditionAppliedBy } from "../combatants/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { SpeedDungeonGame } from "../game/index.js";
import { EntityId } from "../primatives/index.js";
import { getAllyAndEnemyBattleGroups } from "./get-ally-and-enemy-battle-groups.js";
import {
  CombatantIdsByDisposition,
  getAllyIdsAndOpponentIdsOption,
} from "./get-ally-ids-and-opponent-ids-option.js";

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
  static combatantsAreAllies(a: Combatant, b: Combatant, battle: Battle) {
    return (
      (battle.groupA.combatantIds.includes(a.entityProperties.id) &&
        battle.groupA.combatantIds.includes(b.entityProperties.id)) ||
      (battle.groupB.combatantIds.includes(a.entityProperties.id) &&
        battle.groupB.combatantIds.includes(b.entityProperties.id))
    );
  }

  static getAllyIdsAndOpponentIdsOptionOfShimmedConditionUser(
    battle: Battle,
    conditionAppliedTo: EntityId,
    conditionAppliedBy: ConditionAppliedBy
  ): CombatantIdsByDisposition {
    const idsByDispositionOfConditionHolder = Battle.getAllyIdsAndOpponentIdsOption(
      battle,
      conditionAppliedTo
    );
    switch (conditionAppliedBy.friendOrFoe) {
      case FriendOrFoe.Friendly:
        // if applied by a friendly combatant, "ally ids" would be the allies of conditionAppliedTo
        return idsByDispositionOfConditionHolder;
      case FriendOrFoe.Hostile:
        // if applied by a hostile combatant, "ally ids" would be the opponents of conditionAppliedTo
        return Battle.invertAllyAndOpponentIds(idsByDispositionOfConditionHolder);
    }
  }

  static invertAllyAndOpponentIds(
    idsByDisposition: CombatantIdsByDisposition
  ): CombatantIdsByDisposition {
    return {
      allyIds: idsByDisposition.opponentIds,
      opponentIds: idsByDisposition.allyIds,
    };
  }

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

  static getFirstCombatantInTurnOrder(game: SpeedDungeonGame, battle: Battle) {
    const activeCombatantTurnTrackerOption = battle.turnTrackers[0];
    if (!activeCombatantTurnTrackerOption)
      throw new Error(ERROR_MESSAGES.BATTLE.TURN_TRACKERS_EMPTY);

    return SpeedDungeonGame.getCombatantById(game, activeCombatantTurnTrackerOption.entityId);
  }

  static endActiveCombatantTurn = endActiveCombatantTurn;

  /** Useful for ending the turn when the combatant may have already died before this step */
  static endCombatantTurnIfInBattle(
    game: SpeedDungeonGame,
    battle: Battle,
    combatantId: EntityId
  ): Error | CombatantTurnTracker | void {
    const firstCombatantInTurnOrder = Battle.getFirstCombatantInTurnOrder(game, battle);
    if (firstCombatantInTurnOrder instanceof Error) throw firstCombatantInTurnOrder;
    if (firstCombatantInTurnOrder.entityProperties.id === combatantId) {
      return Battle.endActiveCombatantTurn(game, battle);
    }
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

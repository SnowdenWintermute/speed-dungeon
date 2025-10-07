import { AdventuringParty } from "../adventuring-party/index.js";
import { COMBATANT_MAX_ACTION_POINTS } from "../app-consts.js";
import { FriendOrFoe, TurnOrderManager } from "../combat/index.js";
import { CombatantCondition, ConditionWithCombatantIdAppliedTo } from "../combatants/index.js";
import { SpeedDungeonGame } from "../game/index.js";
import { EntityId } from "../primatives/index.js";

export class Battle {
  turnOrderManager: TurnOrderManager;
  constructor(
    public id: EntityId,
    game: SpeedDungeonGame,
    party: AdventuringParty
  ) {
    this.turnOrderManager = new TurnOrderManager(game, party);
    Battle.refillAllCombatantActionPoints(party);
  }

  static getDeserialized(battle: Battle, game: SpeedDungeonGame, party: AdventuringParty) {
    return new Battle(battle.id, game, party);
  }

  static refillAllCombatantActionPoints(party: AdventuringParty) {
    const combatants = party.combatantManager.getAllCombatants();
    for (const combatant of combatants)
      combatant.combatantProperties.actionPoints = COMBATANT_MAX_ACTION_POINTS;
  }

  static getAllTickableConditionsAndCombatants(party: AdventuringParty) {
    const combatants = party.combatantManager.getAllCombatants();
    const tickableConditions: ConditionWithCombatantIdAppliedTo[] = [];
    for (const combatant of combatants) {
      for (const condition of combatant.combatantProperties.conditions) {
        const tickPropertiesOption = CombatantCondition.getTickProperties(condition);
        if (tickPropertiesOption) {
          tickableConditions.push({ condition, appliedTo: combatant.entityProperties.id });
        }
      }
    }

    return { combatants, tickableConditions };
  }

  static invertAllyAndOpponentIds(
    idsByDisposition: Record<FriendOrFoe, EntityId[]>
  ): Record<FriendOrFoe, EntityId[]> {
    return {
      [FriendOrFoe.Hostile]: idsByDisposition[FriendOrFoe.Friendly],
      [FriendOrFoe.Friendly]: idsByDisposition[FriendOrFoe.Hostile],
    };
  }
}

export class BattleGroup {
  constructor(
    public name: string,
    public partyName: EntityId,
    public combatantIds: EntityId[]
  ) {}
}

export enum BattleConclusion {
  Defeat,
  Victory,
}

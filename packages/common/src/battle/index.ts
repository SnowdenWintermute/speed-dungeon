import { AdventuringParty } from "../adventuring-party/index.js";
import { COMBATANT_MAX_ACTION_POINTS } from "../app-consts.js";
import { FriendOrFoe, TurnOrderManager } from "../combat/index.js";
import {
  Combatant,
  CombatantCondition,
  ConditionWithCombatantIdAppliedTo,
} from "../combatants/index.js";
import { SpeedDungeonGame } from "../game/index.js";
import { EntityId } from "../primatives/index.js";
import { getAllyAndEnemyBattleGroups } from "./get-ally-and-enemy-battle-groups.js";

export class Battle {
  turnOrderManager: TurnOrderManager;
  constructor(
    public id: EntityId,
    public groupA: BattleGroup,
    public groupB: BattleGroup,
    game: SpeedDungeonGame,
    party: AdventuringParty
  ) {
    this.turnOrderManager = new TurnOrderManager(game, party, this);
    Battle.refillAllCombatantActionPoints(party);
  }

  static getDeserialized(battle: Battle, game: SpeedDungeonGame, party: AdventuringParty) {
    return new Battle(battle.id, battle.groupA, battle.groupB, game, party);
  }

  static refillAllCombatantActionPoints(party: AdventuringParty) {
    const { characters, monsters } = AdventuringParty.getAllCombatants(party);
    for (const combatant of [...Object.values(characters), ...Object.values(monsters)])
      combatant.combatantProperties.actionPoints = COMBATANT_MAX_ACTION_POINTS;
  }

  static getAllCombatants(game: SpeedDungeonGame, battle: Battle) {
    const allCombatantIds = [...battle.groupA.combatantIds, ...battle.groupB.combatantIds];
    const toReturn: Combatant[] = [];
    for (const combatantId of allCombatantIds) {
      const combatantResult = SpeedDungeonGame.getCombatantById(game, combatantId);
      if (combatantResult instanceof Error) throw combatantResult;
      toReturn.push(combatantResult);
    }
    return toReturn;
  }

  static getAllTickableConditionsAndCombatants(game: SpeedDungeonGame, battle: Battle) {
    const combatants = Battle.getAllCombatants(game, battle);
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

  static removeCombatant(battle: Battle, combatantId: string) {
    battle.groupA.combatantIds = battle.groupA.combatantIds.filter((id) => id !== combatantId);
    battle.groupB.combatantIds = battle.groupB.combatantIds.filter((id) => id !== combatantId);
  }

  static getAllyAndEnemyBattleGroups = getAllyAndEnemyBattleGroups;
  static combatantsAreAllies(a: Combatant, b: Combatant, battle: Battle) {
    return (
      (battle.groupA.combatantIds.includes(a.entityProperties.id) &&
        battle.groupA.combatantIds.includes(b.entityProperties.id)) ||
      (battle.groupB.combatantIds.includes(a.entityProperties.id) &&
        battle.groupB.combatantIds.includes(b.entityProperties.id))
    );
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

import { makeAutoObservable } from "mobx";
import { AdventuringParty } from "../adventuring-party/index.js";
import { applyExperiencePointChanges } from "../combatants/experience-points/apply-experience-point-changes.js";
import { SpeedDungeonGame } from "../game/index.js";
import { Consumable, Equipment, FriendOrFoe } from "../index.js";
import { CombatantId, EntityId } from "../aliases.js";
import { TurnOrderManager } from "../combat/turn-order/turn-order-manager.js";
import { ReactiveNode, Serializable, SerializedOf } from "../serialization/index.js";

export class Battle implements Serializable, ReactiveNode {
  turnOrderManager: TurnOrderManager;
  constructor(public id: EntityId) {
    this.turnOrderManager = new TurnOrderManager();
  }

  makeObservable(): void {
    makeAutoObservable(this);
    this.turnOrderManager.makeObservable();
  }

  toSerialized() {
    return {
      id: this.id,
    };
  }

  static fromSerialized(serialized: SerializedOf<Battle>) {
    return new Battle(serialized.id);
  }

  initialize(game: SpeedDungeonGame, party: AdventuringParty) {
    party.combatantManager.refillAllCombatantActionPoints();
    game.battles.set(this.id, this);
    this.turnOrderManager.turnSchedulerManager.createSchedulers(party);
    this.turnOrderManager.updateTrackers(game, party);
  }

  static createInitialized(game: SpeedDungeonGame, party: AdventuringParty, id: EntityId) {
    const battle = new Battle(id);
    battle.initialize(game, party);
    return battle.id;
  }

  static invertAllyAndOpponentIds(
    idsByDisposition: Record<FriendOrFoe, EntityId[]>
  ): Record<FriendOrFoe, EntityId[]> {
    return {
      [FriendOrFoe.Hostile]: idsByDisposition[FriendOrFoe.Friendly],
      [FriendOrFoe.Friendly]: idsByDisposition[FriendOrFoe.Hostile],
      [FriendOrFoe.Neutral]: idsByDisposition[FriendOrFoe.Neutral],
    };
  }

  /** Returns any levelups by character id  */
  static handleVictory(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    experiencePointChanges: Record<CombatantId, number>,
    loot?: undefined | { equipment: Equipment[]; consumables: Consumable[] }
  ) {
    if (loot) {
      party.currentRoom.inventory.insertItems([...loot.consumables, ...loot.equipment]);
    }
    applyExperiencePointChanges(party, experiencePointChanges);
    const levelUps: Record<EntityId, number> = {};

    const { combatantManager } = party;
    const partyMembers = combatantManager.getPartyMemberCombatants();

    for (const combatant of partyMembers) {
      const { combatantProperties } = combatant;
      const newLevelOption = combatantProperties.classProgressionProperties.awardLevelups();
      if (newLevelOption !== null) levelUps[combatant.entityProperties.id] = newLevelOption;
      // until revives are added, res dead characters to 1 hp
      if (combatantProperties.isDead()) {
        combatantProperties.resources.changeHitPoints(1);
      }
    }

    combatantManager.removeDungeonControlledCombatants(game);
    combatantManager.removeNeutralCombatants(game);

    const battleIdToRemoveOption = party.battleId;
    party.battleId = null;
    if (battleIdToRemoveOption !== null) {
      game.battles.delete(battleIdToRemoveOption);
    }

    return levelUps;
  }
}

export enum BattleConclusion {
  Defeat,
  Victory,
}

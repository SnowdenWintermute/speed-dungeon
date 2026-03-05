import { makeAutoObservable } from "mobx";
import { BattleResultActionCommandPayload } from "../action-processing/index.js";
import { AdventuringParty } from "../adventuring-party/index.js";
import { applyExperiencePointChanges } from "../combatants/experience-points/apply-experience-point-changes.js";
import { SpeedDungeonGame } from "../game/index.js";
import { FriendOrFoe } from "../index.js";
import { EntityId } from "../aliases.js";
import { IdGenerator } from "../utility-classes/index.js";
import { TurnOrderManager } from "../combat/turn-order/turn-order-manager.js";
import { ReactiveNode, Serializable, SerializedOf } from "../serialization/index.js";
import { instanceToPlain, plainToInstance } from "class-transformer";

export class Battle implements Serializable, ReactiveNode {
  turnOrderManager: TurnOrderManager;
  constructor(
    public id: EntityId,
    game: SpeedDungeonGame,
    party: AdventuringParty
  ) {
    this.turnOrderManager = new TurnOrderManager(game, party);
    party.combatantManager.refillAllCombatantActionPoints();
  }

  makeObservable(): void {
    makeAutoObservable(this);
  }

  toSerialized() {
    return instanceToPlain(this);
  }

  static fromSerialized(serialized: SerializedOf<Battle>) {
    return plainToInstance(Battle, serialized);
  }

  static createInitialized(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    idGenerator: IdGenerator
  ) {
    const battle = new Battle(idGenerator.generate(), game, party);
    game.battles.set(battle.id, battle);
    battle.turnOrderManager.updateTrackers(game, party);
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
    payload: BattleResultActionCommandPayload
  ) {
    const { experiencePointChanges, loot } = payload;

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

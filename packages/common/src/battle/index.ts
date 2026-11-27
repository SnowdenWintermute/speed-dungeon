import { makeAutoObservable } from "mobx";
import { AdventuringParty } from "../adventuring-party/index.js";
import { applyExperiencePointChanges } from "../combatants/experience-points/apply-experience-point-changes.js";
import { SpeedDungeonGame } from "../game/index.js";
import {
  ActionIntentAndUser,
  Consumable,
  Equipment,
  FriendOrFoe,
  PartyFateType,
  RandomNumberGenerator,
} from "../index.js";
import { CombatantId, EntityId } from "../aliases.js";
import { TurnOrderManager } from "../combat/turn-order/turn-order-manager.js";
import { ReactiveNode, Serializable, SerializedOf } from "../serialization/index.js";
import { LootGenerator } from "../items/loot-generation/loot-generator.js";
import { getMonsterRewardProfile } from "../monsters/monster-reward-profiles.js";
import { PartyWipes } from "../types.js";
import { generateExperiencePoints } from "../servers/game-server/controllers/battle-processor/generate-experience-points.js";
import { BattleTimeline } from "./battle-timeline.js";

export class Battle implements Serializable, ReactiveNode {
  turnOrderManager: TurnOrderManager;

  constructor(
    public readonly id: EntityId,
    public readonly game: SpeedDungeonGame,
    public readonly party: AdventuringParty,
    public readonly timeline: BattleTimeline
  ) {
    this.turnOrderManager = new TurnOrderManager();
  }

  makeObservable(): void {
    makeAutoObservable(this);
    this.timeline.makeObservable();
    this.turnOrderManager.makeObservable();
  }

  toSerialized() {
    return {
      id: this.id,
      turnOrderManager: this.turnOrderManager.toSerialized(),
      timeline: this.timeline.toSerialized(),
    };
  }

  static fromSerialized(
    serialized: SerializedOf<Battle>,
    game: SpeedDungeonGame,
    party: AdventuringParty
  ) {
    const timeline = BattleTimeline.fromSerialized(serialized.timeline, party);
    const result = new Battle(serialized.id, game, party, timeline);
    result.turnOrderManager = TurnOrderManager.fromSerialized(serialized.turnOrderManager);
    return result;
  }

  // for initializing on server side creation
  initializeOnCreation(initiativeRng: RandomNumberGenerator) {
    this.party.combatantManager.refillAllCombatantActionPoints();
    this.timeline.registerAllCombatantsOnBattleStart(initiativeRng);
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

  reviveCharactersOnPartyVictory() {
    const revivedCharacterIds: CombatantId[] = [];
    const { combatantManager } = this.party;
    const partyMembers = combatantManager.getPartyMemberCombatants();
    for (const combatant of partyMembers) {
      const { combatantProperties } = combatant;
      if (combatantProperties.isDead()) {
        combatantProperties.resources.changeHitPoints(1);
        revivedCharacterIds.push(combatant.getEntityId());
      }
    }

    return revivedCharacterIds;
  }

  calculateLevelupsOnBattleEnd() {
    const levelUps: Record<EntityId, number> = {};
    const { combatantManager } = this.party;
    const partyMembers = combatantManager.getPartyMemberCombatants();
    for (const combatant of partyMembers) {
      const { combatantProperties } = combatant;
      const newLevelOption = combatantProperties.classProgressionProperties.awardLevelups();
      if (newLevelOption !== null) levelUps[combatant.entityProperties.id] = newLevelOption;
    }
    return levelUps;
  }

  resolveBattle(lootGenerator: LootGenerator, partyWipes: PartyWipes) {
    let conclusion: BattleConclusion;
    let loot: { equipment: Equipment[]; consumables: Consumable[] } = {
      equipment: [],
      consumables: [],
    };
    let experiencePointChanges: Record<CombatantId, number> = {};
    let removedConditionIds: {
      conditionId: EntityId;
      fromCombatantId: CombatantId;
    }[] = [];
    let levelUps: Record<EntityId, number> = {};
    let revivedCharacterIds: CombatantId[] = [];
    const branchingActionsResult: ActionIntentAndUser[] = [];

    if (partyWipes.alliesDefeated) {
      conclusion = BattleConclusion.Defeat;
      this.party.fate = { type: PartyFateType.Wipe, timestamp: Date.now() };
      this.game.battles.delete(this.id);
      this.party.setBattleId(null);
    } else {
      conclusion = BattleConclusion.Victory;
      const victory = this.handleBattleVictory(lootGenerator);
      loot = victory.loot;
      experiencePointChanges = victory.experiencePointChanges;
      levelUps = victory.levelUps;
      revivedCharacterIds = victory.revivedCharacterIds;
      removedConditionIds = victory.removedConditionIds;
      branchingActionsResult.push(...victory.branchingActions);
    }

    const actionEntitiesRemoved =
      this.party.actionEntityManager.unregisterActionEntitiesOnBattleEndOrNewRoom();

    return {
      conclusion,
      loot,
      experiencePointChanges,
      removedConditionIds,
      revivedCharacterIds,
      branchingActions: branchingActionsResult,
      actionEntitiesRemoved,
      levelUps,
      timestamp: Date.now(),
    };
  }

  private handleBattleVictory(lootGenerator: LootGenerator): {
    loot: { equipment: Equipment[]; consumables: Consumable[] };
    experiencePointChanges: Record<CombatantId, number>;
    levelUps: Record<EntityId, number>;
    revivedCharacterIds: CombatantId[];
    removedConditionIds: { conditionId: EntityId; fromCombatantId: CombatantId }[];
    branchingActions: ActionIntentAndUser[];
  } {
    const loot = this.generateVictoryLoot(lootGenerator);
    const experiencePointChanges = generateExperiencePoints(this.party);
    this.party.inputLock.unlockInput();

    const items = [...loot.consumables, ...loot.equipment];
    this.party.currentRoom.inventory.insertItems(items);

    applyExperiencePointChanges(this.party, experiencePointChanges);
    const levelUps = this.calculateLevelupsOnBattleEnd();
    // until revive spell/consumables are added, res dead characters to 1 hp
    const revivedCharacterIds = this.reviveCharactersOnPartyVictory();
    const { conditionIdsRemoved, branchingActions } =
      this.party.getBranchingActionsFromConditionsRemovedOnBattleEnd();

    const battleIdToRemoveOption = this.party.battleId;
    this.party.setBattleId(null);
    if (battleIdToRemoveOption !== null) {
      this.game.battles.delete(battleIdToRemoveOption);
    }

    return {
      loot,
      experiencePointChanges,
      levelUps,
      revivedCharacterIds,
      removedConditionIds: conditionIdsRemoved,
      branchingActions,
    };
  }

  private generateVictoryLoot(lootGenerator: LootGenerator): {
    equipment: Equipment[];
    consumables: Consumable[];
  } {
    const floorLevel = this.party.dungeonExplorationManager.getCurrentFloor();
    const defeatedMonsters = this.party.combatantManager.getDungeonControlledCombatants();
    const equipment: Equipment[] = [];
    const consumables: Consumable[] = [];

    for (const monster of defeatedMonsters) {
      const { monsterType } = monster.combatantProperties;
      if (monsterType === null) {
        continue;
      }
      const rewardProfile = getMonsterRewardProfile(monsterType);
      const monsterLoot = lootGenerator.generateLootFromProfile(rewardProfile, floorLevel);
      equipment.push(...monsterLoot.equipment);
      consumables.push(...monsterLoot.consumables);
    }

    return { equipment, consumables };
  }
}

export enum BattleConclusion {
  Defeat,
  Victory,
}

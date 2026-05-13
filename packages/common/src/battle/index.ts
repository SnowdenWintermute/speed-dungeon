import { makeAutoObservable } from "mobx";
import { AdventuringParty } from "../adventuring-party/index.js";
import { applyExperiencePointChanges } from "../combatants/experience-points/apply-experience-point-changes.js";
import { SpeedDungeonGame } from "../game/index.js";
import {
  ActionIntentAndUser,
  Consumable,
  Equipment,
  FriendOrFoe,
  IActionUser,
  invariant,
  ThreatChanges,
} from "../index.js";
import { CombatantId, EntityId } from "../aliases.js";
import { TurnOrderManager } from "../combat/turn-order/turn-order-manager.js";
import { ReactiveNode, Serializable, SerializedOf } from "../serialization/index.js";
import { LootGenerator } from "../items/item-creation/loot-generator.js";
import { PartyWipes } from "../types.js";
import { generateExperiencePoints } from "../servers/game-server/controllers/battle-processor/generate-experience-points.js";

export class Battle implements Serializable, ReactiveNode {
  turnOrderManager: TurnOrderManager;
  private _game: SpeedDungeonGame | null = null;
  private _party: AdventuringParty | null = null;
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
      turnOrderManager: this.turnOrderManager.toSerialized(),
    };
  }

  static fromSerialized(serialized: SerializedOf<Battle>) {
    const result = new Battle(serialized.id);
    result.turnOrderManager = TurnOrderManager.fromSerialized(serialized.turnOrderManager);
    return result;
  }

  // for initializing on server side creation
  initializeOnCreation(game: SpeedDungeonGame, party: AdventuringParty) {
    this._game = game;
    this._party = party;
    party.combatantManager.refillAllCombatantActionPoints();
    game.battles.set(this.id, this);
    this.turnOrderManager.turnSchedulerManager.createSchedulers(party);
    this.turnOrderManager.updateTrackers(game, party);
  }

  // for initializing after deserialization
  initializeAfterDeserialization(game: SpeedDungeonGame, party: AdventuringParty) {
    this._game = game;
    this._party = party;
    game.battles.set(this.id, this);
    this.turnOrderManager.updateTrackers(game, party);
  }

  get party() {
    invariant(this._party !== null, "battle not initialized");
    return this._party;
  }

  get game() {
    invariant(this._game !== null, "battle not initialized");
    return this._game;
  }

  static createInitialized(game: SpeedDungeonGame, party: AdventuringParty, id: EntityId) {
    const battle = new Battle(id);
    battle.initializeOnCreation(game, party);
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

  handleTurnEnded(
    actionUserOption: IActionUser | undefined,
    delay: number,
    threatChanges?: ThreatChanges
  ) {
    const { turnSchedulerManager } = this.turnOrderManager;

    const turnSchedulerOption = actionUserOption
      ? turnSchedulerManager.getSchedulerOptionByEntityId(actionUserOption.getEntityId())
      : undefined;

    if (turnSchedulerOption) {
      turnSchedulerOption.addDelay(delay);
      this.turnOrderManager.updateTrackers(this.game, this.party);
    }

    actionUserOption?.handleTurnEnded();

    if (threatChanges) {
      threatChanges.applyToGame(this.party);
    }
  }

  getSchedulerDelayForNewActionUser() {
    this.turnOrderManager.updateTrackers(this.game, this.party);
    const fastestTurnTracker = this.turnOrderManager.getFastestActorTurnOrderTracker();
    const delayOfCurrentActor = fastestTurnTracker.timeOfNextMove;
    const delayOfNewSheduler = delayOfCurrentActor;
    return delayOfNewSheduler;
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
      this.party.timeOfWipe = Date.now();
      this.game.battles.delete(this.id);
      this.party.setBattleId(null);
    } else {
      conclusion = BattleConclusion.Victory;
      loot = lootGenerator.generateLoot(
        this.party.combatantManager.getDungeonControlledCombatants().length,
        this.party.dungeonExplorationManager.getCurrentFloor()
      );
      experiencePointChanges = generateExperiencePoints(this.party);
      this.party.inputLock.unlockInput();

      if (loot) {
        const items = [...loot.consumables, ...loot.equipment];
        this.party.currentRoom.inventory.insertItems(items);
      }
      applyExperiencePointChanges(this.party, experiencePointChanges);
      levelUps = this.calculateLevelupsOnBattleEnd();
      // until revive spell/consumables are added, res dead characters to 1 hp
      revivedCharacterIds = this.reviveCharactersOnPartyVictory();
      const conditionRemovalsAndTriggeredActions =
        this.party.getBranchingActionsFromConditionsRemovedOnBattleEnd();
      const { conditionIdsRemoved, branchingActions } = conditionRemovalsAndTriggeredActions;
      removedConditionIds = conditionIdsRemoved;
      branchingActionsResult.push(...branchingActions);

      const battleIdToRemoveOption = this.party.battleId;
      this.party.setBattleId(null);
      if (battleIdToRemoveOption !== null) {
        this.game.battles.delete(battleIdToRemoveOption);
      }
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
}

export enum BattleConclusion {
  Defeat,
  Victory,
}

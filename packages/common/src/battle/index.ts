import { makeAutoObservable } from "mobx";
import { AdventuringParty } from "../adventuring-party/index.js";
import { applyExperiencePointChanges } from "../combatants/experience-points/apply-experience-point-changes.js";
import { SpeedDungeonGame } from "../game/index.js";
import {
  ActionIntentAndUser,
  CombatActionName,
  Combatant,
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
    };
  }

  static fromSerialized(serialized: SerializedOf<Battle>) {
    return new Battle(serialized.id);
  }

  initialize(game: SpeedDungeonGame, party: AdventuringParty) {
    this._game = game;
    this._party = party;
    party.combatantManager.refillAllCombatantActionPoints();
    game.battles.set(this.id, this);
    this.turnOrderManager.turnSchedulerManager.createSchedulers(party);
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
    const delayOfNewSheduler = delayOfCurrentActor + 1;
    return delayOfNewSheduler;
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

    const revivedCharacterIds: CombatantId[] = [];
    for (const combatant of partyMembers) {
      const { combatantProperties } = combatant;
      const newLevelOption = combatantProperties.classProgressionProperties.awardLevelups();
      if (newLevelOption !== null) levelUps[combatant.entityProperties.id] = newLevelOption;
      // until revives are added, res dead characters to 1 hp
      if (combatantProperties.isDead()) {
        combatantProperties.resources.changeHitPoints(1);
        revivedCharacterIds.push(combatant.getEntityId());
      }
    }

    const removedDungeonControlled = combatantManager.removeDungeonControlledCombatants(game);
    const removedNeutral = combatantManager.removeNeutralCombatants(game);

    const removedCombatantIds: CombatantId[] = [
      ...removedDungeonControlled.map((c) => c.getEntityId()),
      ...removedNeutral.map((c) => c.getEntityId()),
    ];
    const branchingActions: ActionIntentAndUser[] = [];
    const conditionIdsRemoved: { conditionId: EntityId; fromCombatantId: CombatantId }[] = [];
    for (const removedCombatant of [...removedDungeonControlled, ...removedNeutral]) {
      const { onDeathProperties } = removedCombatant.combatantProperties;
      const shouldRemoveAllConditionsAppliedBy = onDeathProperties?.removeConditionsApplied;

      if (shouldRemoveAllConditionsAppliedBy) {
        const { triggeredActions, conditionIdsRemoved: idsRemoved } =
          party.removeConditionsAppliedByCombatant(removedCombatant.getEntityId());
        branchingActions.push(...triggeredActions);
        conditionIdsRemoved.push(...idsRemoved);
      }
    }

    const battleIdToRemoveOption = party.battleId;
    party.setBattleId(null);
    if (battleIdToRemoveOption !== null) {
      game.battles.delete(battleIdToRemoveOption);
    }

    return {
      levelUps,
      branchingActions,
      conditionIdsRemoved,
      removedCombatantIds,
      revivedCharacterIds,
    };
  }

  static resolveBattle(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    lootGenerator: LootGenerator,
    partyWipes: PartyWipes
  ) {
    let conclusion: BattleConclusion;
    let loot: { equipment: Equipment[]; consumables: Consumable[] } = {
      equipment: [],
      consumables: [],
    };
    let experiencePointChanges: Record<CombatantId, number> = {};
    let branchingActions: ActionIntentAndUser[] = [];
    let levelUps: Record<CombatantId, number> = {};
    let removedCombatantIds: CombatantId[] = [];
    let revivedCharacterIds: CombatantId[] = [];
    const removedConditionIds: Record<CombatantId, EntityId[]> = {};

    if (partyWipes.alliesDefeated) {
      conclusion = BattleConclusion.Defeat;
      party.timeOfWipe = Date.now();
      if (party.battleId !== null) {
        game.battles.delete(party.battleId);
      }
      party.setBattleId(null);
    } else {
      conclusion = BattleConclusion.Victory;
      loot = lootGenerator.generateLoot(
        party.combatantManager.getDungeonControlledCombatants().length,
        party.dungeonExplorationManager.getCurrentFloor()
      );
      experiencePointChanges = generateExperiencePoints(party);
      party.inputLock.unlockInput();

      const victoryResult = Battle.handleVictory(game, party, experiencePointChanges, loot);
      levelUps = victoryResult.levelUps;
      branchingActions = victoryResult.branchingActions;
      removedCombatantIds = victoryResult.removedCombatantIds;
      revivedCharacterIds = victoryResult.revivedCharacterIds;
      for (const { conditionId, fromCombatantId } of victoryResult.conditionIdsRemoved) {
        const existing = removedConditionIds[fromCombatantId] ?? [];
        existing.push(conditionId);
        removedConditionIds[fromCombatantId] = existing;
      }
    }

    const actionEntitiesRemoved =
      party.actionEntityManager.unregisterActionEntitiesOnBattleEndOrNewRoom();

    return {
      conclusion,
      loot,
      experiencePointChanges,
      removedConditionIds,
      removedCombatantIds,
      revivedCharacterIds,
      actionEntitiesRemoved,
      branchingActions,
      levelUps,
      timestamp: Date.now(),
    };
  }
}

export enum BattleConclusion {
  Defeat,
  Victory,
}

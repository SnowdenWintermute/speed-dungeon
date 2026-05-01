import { DungeonRoom, DungeonRoomType } from "./dungeon-room.js";
import { SpeedDungeonGame } from "../game/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { DungeonExplorationManager } from "./dungeon-exploration-manager.js";
import { ActionEntityManager } from "./action-entity-manager.js";
import { PetManager } from "./pet-manager.js";
import { CombatantManager } from "./combatant-manager.js";
import { Combatant } from "../combatants/index.js";
import { ArrayUtils } from "../utils/array-utils.js";
import { makeAutoObservable } from "mobx";
import { Item } from "../items/index.js";
import { AdventuringPartySubsystem } from "./party-subsystem.js";
import { CombatantId, ConditionId, EntityId, PartyName, Username } from "../aliases.js";
import { SpeedDungeonPlayer } from "../game/player.js";
import { TimedLock } from "../primatives/timed-lock.js";
import {
  ReactiveNode,
  Serializable,
  SerializedOf,
  makePropertiesObservable,
} from "../serialization/index.js";
import { ActionIntentAndUser } from "../action-processing/action-steps/index.js";
import { IActionUser } from "../action-user-context/action-user.js";
import { invariant } from "../utils/index.js";

export class AdventuringParty implements Serializable, ReactiveNode {
  // subsystems
  actionEntityManager = new ActionEntityManager();
  dungeonExplorationManager = new DungeonExplorationManager();
  petManager = new PetManager();
  combatantManager = new CombatantManager();
  // other
  playerUsernames: Username[] = [];
  playerUsernamesAwaitingReconnection = new Set<Username>();
  currentRoom: DungeonRoom = new DungeonRoom(DungeonRoomType.Empty);
  battleId: null | EntityId = null;
  _timeOfWipe: null | number = null;
  timeOfEscape: null | number = null;
  inputLock = new TimedLock();

  constructor(
    public id: string,
    public name: PartyName
  ) {}

  get timeOfWipe() {
    return this._timeOfWipe;
  }
  set timeOfWipe(value: number | null) {
    this._timeOfWipe = value;
  }

  makeObservable() {
    makeAutoObservable(this);
    makePropertiesObservable(this);
  }

  static createInitialized(id: EntityId, name: string) {
    const party = new AdventuringParty(id, name as PartyName);
    party.initialize();
    return party;
  }

  toSerialized() {
    return {
      id: this.id,
      name: this.name,
      actionEntityManager: this.actionEntityManager.toSerialized(),
      dungeonExplorationManager: this.dungeonExplorationManager.toSerialized(),
      petManager: this.petManager.toSerialized(),
      combatantManager: this.combatantManager.toSerialized(),
      playerUsernames: this.playerUsernames,
      currentRoom: this.currentRoom.toSerialized(),
      battleId: this.battleId,
      _timeOfWipe: this._timeOfWipe,
      timeOfEscape: this.timeOfEscape,
      inputLock: this.inputLock.toSerialized(),
    };
  }

  static fromSerialized(serialized: SerializedOf<AdventuringParty>) {
    const result = new AdventuringParty(serialized.id, serialized.name);

    result.actionEntityManager = ActionEntityManager.fromSerialized(serialized.actionEntityManager);
    result.dungeonExplorationManager = DungeonExplorationManager.fromSerialized(
      serialized.dungeonExplorationManager
    );
    result.petManager = PetManager.fromSerialized(serialized.petManager);
    result.combatantManager = CombatantManager.fromSerialized(serialized.combatantManager);
    result.playerUsernames = serialized.playerUsernames;
    result.currentRoom = DungeonRoom.fromSerialized(serialized.currentRoom);
    result.battleId = serialized.battleId;
    result._timeOfWipe = serialized._timeOfWipe;
    result.timeOfEscape = serialized.timeOfEscape;
    result.inputLock = TimedLock.fromSerialized(serialized.inputLock);
    result.initialize();

    return result;
  }

  initialize() {
    for (const value of Object.values(this)) {
      const isSubsystem = value instanceof AdventuringPartySubsystem;
      if (!isSubsystem) continue;
      value.initialize(this);
    }
  }

  getItem(itemId: string) {
    let toReturn: undefined | Item;

    for (const combatant of this.combatantManager.iterateAllCombatants()) {
      const itemResult = combatant.combatantProperties.inventory.getStoredOrEquipped(itemId);
      if (itemResult instanceof Error) continue;
      toReturn = itemResult;
      if (toReturn) return toReturn;
    }

    const maybeItem = this.currentRoom.inventory.getItemById(itemId);
    if (!(maybeItem instanceof Error)) return maybeItem;

    return new Error(ERROR_MESSAGES.ITEM.NOT_FOUND);
  }

  setBattleId(newId: null | EntityId) {
    this.battleId = newId;
  }

  getBattleOption(game: SpeedDungeonGame) {
    const battleIdOption = this.battleId;
    if (battleIdOption === null) {
      return null;
    }
    return game.getExpectedBattle(battleIdOption);
  }

  requireBattle(game: SpeedDungeonGame) {
    const battleOption = this.getBattleOption(game);
    invariant(battleOption !== null, "expected battle not found");
    return battleOption;
  }

  allMonstersAreDead() {
    return this.combatantManager
      .getDungeonControlledCombatants()
      .every((combatant) => combatant.getCombatantProperties().isDead());
  }

  isInCombat() {
    const monstersArePresent = this.combatantManager.monstersArePresent();
    const livingMonstersRemain = !this.allMonstersAreDead();
    return monstersArePresent && livingMonstersRemain;
  }

  requireNotInCombat() {
    if (this.isInCombat()) {
      throw new Error(ERROR_MESSAGES.PARTY.CANT_EXPLORE_WHILE_MONSTERS_ARE_PRESENT);
    }
  }

  removeCharacter(
    characterId: CombatantId,
    player: SpeedDungeonPlayer,
    game: SpeedDungeonGame
  ): Combatant {
    ArrayUtils.removeElement(player.characterIds, characterId);
    const character = this.combatantManager.removeCombatant(characterId, game);
    const summonedPetOption = this.petManager.getCombatantSummonedPetOption(
      character.getEntityId()
    );
    if (summonedPetOption) {
      this.petManager.unsummonPet(summonedPetOption.getEntityId(), game);
      this.petManager.clearCombatantPets(characterId);
    }
    return character;
  }

  setCurrentRoom(room: DungeonRoom) {
    this.currentRoom = room;
  }

  requireInputUnlocked() {
    if (this.inputLock.isLocked()) {
      throw new Error(ERROR_MESSAGES.PARTY.INPUT_IS_LOCKED);
    }
  }

  requireDescentPermitted() {
    this.requireNotInCombat();
    this.currentRoom.requireType(DungeonRoomType.Staircase);
  }

  removeConditionsAppliedByCombatant(applyerId: CombatantId) {
    const triggeredActions: ActionIntentAndUser[] = [];
    const conditionIdsRemoved: { conditionId: ConditionId; fromCombatantId: CombatantId }[] = [];
    for (const [_, combatant] of this.combatantManager.getAllCombatants()) {
      for (const condition of combatant.combatantProperties.conditionManager.getConditions()) {
        const wasAppliedByDyingCombatant = condition.appliedBy.entityProperties.id === applyerId;
        if (!wasAppliedByDyingCombatant) continue;

        combatant.combatantProperties.conditionManager.removeConditionById(condition.id);

        const onRemovedTriggeredActions = condition.onRemoved(this);
        triggeredActions.push(...onRemovedTriggeredActions);
        conditionIdsRemoved.push({
          conditionId: condition.getEntityId(),
          fromCombatantId: combatant.getEntityId(),
        });
      }
    }

    return { triggeredActions, conditionIdsRemoved };
  }

  getActionUserById(id: EntityId): IActionUser | undefined {
    const combatantOption = this.combatantManager.getCombatantOption(id);
    if (combatantOption) {
      return combatantOption;
    }
    for (const [actionEntityId, actionEntity] of this.actionEntityManager.getActionEntities()) {
      if (id === actionEntityId) {
        return actionEntity;
      }
    }
    for (const [combatantId, combatant] of this.combatantManager.getAllCombatants()) {
      const conditionOption = this.combatantManager.getConditionOptionOnCombatant(combatantId, id);
      if (conditionOption) {
        return conditionOption;
      }
    }
  }

  getBranchingActionsFromConditionsRemovedOnBattleEnd() {
    const { combatantManager } = this;
    const dungeonControlledCombatants = combatantManager.getDungeonControlledCombatants();
    const neutralCombatants = combatantManager.getNeutralCombatants();

    const branchingActions: ActionIntentAndUser[] = [];
    const conditionIdsRemoved: { conditionId: EntityId; fromCombatantId: CombatantId }[] = [];

    for (const combatant of [...neutralCombatants, ...dungeonControlledCombatants]) {
      const { onDeathProperties } = combatant.combatantProperties;
      const shouldRemoveAllConditionsAppliedBy = onDeathProperties?.removeConditionsApplied;

      if (shouldRemoveAllConditionsAppliedBy) {
        const { triggeredActions, conditionIdsRemoved: idsRemoved } =
          this.removeConditionsAppliedByCombatant(combatant.getEntityId());
        branchingActions.push(...triggeredActions);
        conditionIdsRemoved.push(...idsRemoved);
      }
    }

    return {
      branchingActions,
      conditionIdsRemoved,
    };
  }

  removeCombatantsOnBattleEnd(game: SpeedDungeonGame) {
    const { combatantManager } = this;
    const removedDungeonControlled = combatantManager.removeDungeonControlledCombatants(game);
    const removedNeutral = combatantManager.removeNeutralCombatants(game);

    const removedCombatantIds: CombatantId[] = [
      ...removedDungeonControlled.map((c) => c.getEntityId()),
      ...removedNeutral.map((c) => c.getEntityId()),
    ];

    return removedCombatantIds;
  }
}

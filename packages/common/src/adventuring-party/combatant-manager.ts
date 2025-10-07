import { plainToInstance } from "class-transformer";
import { FriendOrFoe } from "../combat/index.js";
import {
  Combatant,
  CombatantCondition,
  CombatantControllerType,
  CombatantProperties,
} from "../combatants/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { EntityId } from "../primatives/index.js";

export class CombatantManager {
  private combatants: Map<EntityId, Combatant> = new Map();

  getCombatantOption(entityId: string): Combatant | undefined {
    return this.combatants.get(entityId);
  }

  getExpectedCombatant(combatantId: EntityId) {
    const combatantOption = this.getCombatantOption(combatantId);
    if (combatantOption === undefined) throw new Error(ERROR_MESSAGES.COMBATANT.NOT_FOUND);
    return combatantOption;
  }

  getAllCombatantIds() {
    return this.combatants.keys();
  }

  /** Gets entityIds of combatants in group in left to right order from the perspective of
   * the group members' home positions facing the world origin. Useful for rendering combatant
   * plaques in order and for cycling through targets in a group in order.*/
  sortCombatantIdsLeftToRight(
    entityIds: EntityId[],
    options?: {
      summonedCombatantsOnly?: boolean;
      excludeSummonedCombatants?: boolean;
    }
  ): EntityId[] {
    const combatants = this.getExpectedCombatants(entityIds);

    const filtered = combatants.filter((combatant) => {
      const isSummoned = combatant.combatantProperties.summonedBy !== undefined ?? false;
      if (options?.summonedCombatantsOnly) return isSummoned;
      if (options?.excludeSummonedCombatants) return !isSummoned;
      return true;
    });

    const sorted = filtered.sort((a, b) => {
      const ax = a.getHomePosition().x;
      const bx = b.getHomePosition().x;
      return ax - bx;
    });

    return sorted.map((combatant) => combatant.getEntityId());
  }

  getAllCombatants() {
    return this.combatants;
  }

  getExpectedCombatants(entityIds: EntityId[]) {
    const toReturn: Combatant[] = [];

    for (const id of entityIds) {
      const combatant = this.getExpectedCombatant(id);
      toReturn.push(combatant);
    }

    return toReturn;
  }

  getAllCombatantsByControllerType(controllerType: CombatantControllerType) {
    const toReturn: Combatant[] = [];
    for (const [entityId, combatant] of this.combatants.entries()) {
      const hasMatchingControllerType =
        combatant.combatantProperties.controlledBy.controllerType === controllerType;
      if (hasMatchingControllerType) {
        toReturn.push(combatant);
      }
    }

    return toReturn;
  }

  getConditionOptionOnCombatant(
    combatantId: EntityId,
    conditionId: EntityId
  ): undefined | CombatantCondition {
    const combatantOption = this.getCombatantOption(combatantId);
    if (combatantOption === undefined) return undefined;
    const conditionOption = CombatantProperties.getConditionById(
      combatantOption.combatantProperties,
      conditionId
    );
    if (conditionOption === null) return undefined;
    return conditionOption;
  }

  combatantsAreAllies(a: Combatant, b: Combatant) {
    const aType = a.combatantProperties.controlledBy.controllerType;
    const bType = b.combatantProperties.controlledBy.controllerType;
    const aIsDungeonControlled = aType === CombatantControllerType.Dungeon;
    const bIsDungeonControlled = bType === CombatantControllerType.Dungeon;
    const bothDungeonControlled = aIsDungeonControlled && bIsDungeonControlled;
    const bothPlayerTeam = !aIsDungeonControlled && !bIsDungeonControlled;
    return bothDungeonControlled || bothPlayerTeam;
  }

  getCombatantIdsByDispositionTowardsCombatantId(
    combatantId: string
  ): Record<FriendOrFoe, EntityId[]> {
    const combatant = this.getExpectedCombatant(combatantId);

    const toReturn: Record<FriendOrFoe, EntityId[]> = {
      [FriendOrFoe.Friendly]: [],
      [FriendOrFoe.Hostile]: [],
    };

    for (const [entityId, combatantToCompare] of this.combatants.entries()) {
      const comparedIsAlly = this.combatantsAreAllies(combatant, combatantToCompare);

      if (comparedIsAlly) {
        toReturn[FriendOrFoe.Friendly].push(entityId);
      } else {
        toReturn[FriendOrFoe.Hostile].push(entityId);
      }
    }

    return toReturn;
  }

  hasCharacters() {
    for (const combatant of this.combatants.values()) {
      const { controllerType } = combatant.combatantProperties.controlledBy;
      if (controllerType === CombatantControllerType.Player) return true;
    }
    return false;
  }

  getCharacterIfOwned(playerName: string, characterId: string): Error | Combatant {
    // if (!playerCharacterIdsOption) return new Error(ERROR_MESSAGES.PLAYER.NO_CHARACTERS);
    for (const combatant of this.combatants.values()) {
      const { controllerName } = combatant.combatantProperties.controlledBy;
      if (controllerName === playerName) return combatant;
    }
    return new Error(ERROR_MESSAGES.PLAYER.CHARACTER_NOT_OWNED);
  }

  playerOwnsCharacter(playerName: string, characterId: string) {
    const combatant = this.getExpectedCombatant(characterId);
    combatant.combatantProperties;
    const { controllerName } = combatant.combatantProperties.controlledBy;
    return controllerName === playerName;
  }

  /** Expects the combatant to exist. Returns the removed combatant. */
  removeCombatant(combatantId: EntityId) {
    const combatant = this.getExpectedCombatant(combatantId);
    this.combatants.delete(combatantId);
    return combatant;
  }

  static getDeserialized(serialized: CombatantManager): CombatantManager {
    const deserialized = plainToInstance(CombatantManager, serialized);
    deserialized.combatants = new Map();

    for (const [entityId, combatantJson] of Object.entries(serialized.combatants)) {
      const combatant = Combatant.getDeserialized(combatantJson);
      deserialized.combatants.set(entityId as EntityId, combatant);
    }

    return deserialized;
  }
}

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
}

// Conceptual groups
// .controlled by players in this client's part
// .controlled by "the dungeon" ai
// .controlled by player pet ai of pets of players in this party
// .controlled by players of another party
// .controlled by pet ai of players of another party

// Things to do with groups
// .display plaques of
//   ..this party's characters
//   ..this party's pets
//   ..dungeon controlled combatants
//   ..dungeon controlled pets

// .target entire group of or a single entity from
//   ..dungeon controlled combatants
//   ..player combatants and pets of this party
//   ..player combatants and pets of another player controlled party

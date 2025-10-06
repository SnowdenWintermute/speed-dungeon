import { FriendOrFoe } from "../combat/index.js";
import { Combatant, CombatantCondition, CombatantProperties } from "../combatants/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { EntityId } from "../primatives/index.js";
import { AdventuringParty } from "./index.js";

export class CombatantGroup {
  private combatants: Record<EntityId, Combatant> = {};

  getCombatantOption(entityId: EntityId) {
    return this.combatants[entityId];
  }

  /** Gets entityIds of combatants in group in left to right order from the perspective of
   * the group members' home positions facing the world origin. Useful for rendering combatant
   * plaques in order and for cycling through targets in a group in order.*/
  getIdsLeftToRight(options?: {
    summonedCombatantsOnly?: boolean;
    excludeSummonedCombatants?: boolean;
  }): EntityId[] {
    throw new Error("not implemented");
  }

  getDisposition(towardCombatant: Combatant) {}
}

export class CombatantManager {
  private combatantGroups: CombatantGroup[] = [];

  getCombatantOption(entityId: string): Combatant | undefined {
    for (const group of this.combatantGroups) {
      const combatantOption = group.getCombatantOption(entityId);
      if (combatantOption !== undefined) return group.getCombatantOption(entityId);
    }
    return undefined;
  }

  getExpectedCombatant(combatantId: EntityId) {
    const combatantOption = this.getCombatantOption(combatantId);
    if (combatantOption === undefined) throw new Error(ERROR_MESSAGES.COMBATANT.NOT_FOUND);
    return combatantOption;
  }

  getAllCombatantIds(party: AdventuringParty) {
    const toReturn: EntityId[] = [];
    for (const group of this.combatantGroups) {
      toReturn.push(...group.getIdsLeftToRight());
    }
  }

  getAllCombatants(party: AdventuringParty) {
    return { characters: this.characters, monsters: party.currentRoom.monsters };
  }

  getExpectedCombatants(entityIds: EntityId[]) {
    const toReturn: Combatant[] = [];

    for (const id of entityIds) {
      const combatant = this.getExpectedCombatant(id);
      toReturn.push(combatant);
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

  getCombatantIdsByDispositionTowardsCombatantId(
    party: AdventuringParty,
    combatantId: string
  ): Record<FriendOrFoe, EntityId[]> {
    if (this.characterPositions.includes(combatantId)) {
      return {
        [FriendOrFoe.Friendly]: this.characterPositions,
        [FriendOrFoe.Hostile]: party.currentRoom.monsterPositions,
      };
    } else if (party.currentRoom.monsterPositions.includes(combatantId)) {
      return {
        [FriendOrFoe.Friendly]: party.currentRoom.monsterPositions,
        [FriendOrFoe.Hostile]: this.characterPositions,
      };
    } else {
      throw new Error(ERROR_MESSAGES.COMBATANT.NOT_FOUND);
    }
  }
}

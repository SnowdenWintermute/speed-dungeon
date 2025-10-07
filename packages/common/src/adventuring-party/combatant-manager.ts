import { plainToInstance } from "class-transformer";
import { FriendOrFoe } from "../combat/index.js";
import { Combatant, CombatantCondition, CombatantProperties } from "../combatants/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { EntityId } from "../primatives/index.js";
import { CombatantControllerType } from "../combatants/combatant-controllers.js";

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
    return Array.from(this.combatants.keys());
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
      const isSummoned = combatant.combatantProperties.summonedBy !== undefined;
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
    return Array.from(this.combatants.values());
  }

  getExpectedCombatants(entityIds: EntityId[]) {
    const toReturn: Combatant[] = [];

    for (const id of entityIds) {
      const combatant = this.getExpectedCombatant(id);
      toReturn.push(combatant);
    }

    return toReturn;
  }

  static PARTY_MEMBER_CONTROLLER_TYPES = [
    CombatantControllerType.Player,
    CombatantControllerType.PlayerPetAI,
  ];

  /** Returns player controlled characters and their pets */
  getPartyMemberCombatants() {
    return this.getAllCombatantsWithControllerTypes(CombatantManager.PARTY_MEMBER_CONTROLLER_TYPES);
  }

  getPartyMemberCharacters() {
    return this.getAllCombatantsWithControllerTypes([CombatantControllerType.Player]);
  }

  getDungeonControlledCombatants() {
    return this.getAllCombatantsWithControllerTypes([CombatantControllerType.Dungeon]);
  }

  private getAllCombatantsWithControllerTypes(controllerTypes: CombatantControllerType[]) {
    const matchingCombatants = Array.from(this.combatants.values()).filter((combatant) => {
      const { controllerType } = combatant.combatantProperties.controlledBy;
      const hasMatchingControllerType = controllerTypes.includes(controllerType);
      return hasMatchingControllerType;
    });

    return matchingCombatants;
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

  getExpectedConditionOnCombatant(
    combatantId: EntityId,
    conditionId: EntityId
  ): CombatantCondition {
    const conditionOption = this.getConditionOptionOnCombatant(combatantId, conditionId);
    if (conditionOption === undefined) throw new Error(ERROR_MESSAGES.COMBATANT.NOT_FOUND);
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

  /** Pass the id of the combatant toward which the disposition should be calculated */
  getCombatantIdsByDisposition(towardsId: string): Record<FriendOrFoe, EntityId[]> {
    const combatant = this.getExpectedCombatant(towardsId);

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

  addCombatant(combatant: Combatant) {
    this.combatants.set(combatant.getEntityId(), combatant);
  }

  removeDungeonControlledCombatants() {
    for (const combatant of this.getDungeonControlledCombatants()) {
      this.removeCombatant(combatant.getEntityId());
    }
  }

  monstersArePresent() {
    return this.getDungeonControlledCombatants().length > 0;
  }

  updateHomePositions() {
    throw new Error("not implemented");
    // @TODO -conform to new combatantManager flat combatant list
    // const isPlayer =
    //   combatantProperties.controlledBy.controllerType === CombatantControllerType.Player;
    // const { combatantManager } = party;
    // const combatantIdsInRow = isPlayer
    //   ? party.characterPositions
    //   : party.currentRoom.monsterPositions;
    // const numberOfCombatantsInRow = combatantIdsInRow.length;
    // const rowLength = COMBATANT_POSITION_SPACING_SIDE * (numberOfCombatantsInRow - 1);
    // const rowStart = -rowLength / 2;
    // const combatantRowIndex = combatantIdsInRow.indexOf(entityId);
    // if (combatantRowIndex === -1) return console.error("Expected combatant id not found in row");
    // const rowPositionOffset = rowStart + combatantRowIndex * COMBATANT_POSITION_SPACING_SIDE;
    // let positionSpacing = -COMBATANT_POSITION_SPACING_BETWEEN_ROWS / 2;
    // if (!isPlayer) positionSpacing *= -1;
    // const homeLocation = new Vector3(rowPositionOffset, 0, positionSpacing);
    // combatantProperties.homeLocation = homeLocation;
    // combatantProperties.position = combatantProperties.homeLocation.clone();
    // const forward = new Vector3(0, 0, 1);
    // const directionToXAxis = new Vector3(0, 0, -positionSpacing).normalize();
    // const homeRotation = new Quaternion();
    // Quaternion.FromUnitVectorsToRef(forward, directionToXAxis, homeRotation);
    // combatantProperties.homeRotation = homeRotation;
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

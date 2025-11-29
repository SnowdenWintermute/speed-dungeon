import { plainToInstance } from "class-transformer";
import { makeAutoObservable } from "mobx";
import { EntityId } from "../primatives/index.js";
import { runIfInBrowser } from "../utils/index.js";
import { AdventuringParty } from "../adventuring-party/index.js";
import { AiType } from "../combat/ai-behavior/index.js";

export enum CombatantControllerType {
  Player,
  Dungeon,
  PlayerPetAI,
}

/** We use the player name, even though it can change, because using the ownerId (snowauth id)
 * would expose it to the client. The tradeoff is a player can not change their username mid game without
 * forfeiting control of their characters. In practice, we ask their client to reconnect all sockets anyway
 * after a username change.
 * */
export class CombatantControlledBy {
  summonedBy?: EntityId;
  aiTypes?: AiType[];
  constructor(
    public controllerType: CombatantControllerType,
    /** For player name, can be empty string if this is dungeon controlled */
    public controllerPlayerName: string
  ) {
    runIfInBrowser(() => makeAutoObservable(this));
  }

  static getDeserialized(controlledBy: CombatantControlledBy) {
    return plainToInstance(CombatantControlledBy, controlledBy);
  }

  isPlayerControlled() {
    return this.controllerType === CombatantControllerType.Player;
  }

  isPlayerPet() {
    return this.controllerType === CombatantControllerType.PlayerPetAI;
  }

  isDungeonControlled() {
    return this.controllerType === CombatantControllerType.Dungeon;
  }

  wasSummoned() {
    return this.summonedBy !== undefined;
  }

  getExpectedSummonedByCombatant(party: AdventuringParty) {
    if (this.summonedBy === undefined) {
      throw new Error("Expected this combatant to have been summoned by someone");
    }
    return party.combatantManager.getExpectedCombatant(this.summonedBy);
  }

  wasSummonedByCharacterControlledByPlayer(playerName: string, party: AdventuringParty) {
    const { combatantManager } = party;
    for (const character of combatantManager.getPartyMemberCharacters()) {
      const { controllerPlayerName } = character.combatantProperties.controlledBy;
      const isCharacterOfThisPlayer = controllerPlayerName === playerName;
      if (!isCharacterOfThisPlayer) {
        continue;
      }
      const wasSummonedByThisCharacter = this.summonedBy === character.getEntityId();
      if (wasSummonedByThisCharacter) {
        return true;
      }
    }

    return false;
  }
}

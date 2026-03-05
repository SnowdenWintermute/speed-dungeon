import makeAutoObservable from "mobx-store-inheritance";
import { EntityId, Username } from "../aliases.js";
import { AdventuringParty } from "../adventuring-party/index.js";
import { AiType } from "../combat/ai-behavior/index.js";
import { CombatantSubsystem } from "./combatant-subsystem.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { ReactiveNode, Serializable, SerializedOf } from "../serialization/index.js";
import { instanceToPlain, plainToInstance } from "class-transformer";
import { CombatantProperties } from "./combatant-properties.js";

export enum CombatantControllerType {
  Player,
  Dungeon,
  PlayerPetAI,
  Neutral,
}

/** We use the player name, even though it can change, because using the ownerId (snowauth id)
 * would expose it to the client. The tradeoff is a player can not change their username mid game without
 * forfeiting control of their characters. In practice, we ask their client to reconnect all sockets anyway
 * after a username change.
 * */
export class CombatantControlledBy
  extends CombatantSubsystem
  implements ReactiveNode, Serializable
{
  summonedBy?: EntityId;
  private aiTypes?: AiType[];
  constructor(
    public controllerType: CombatantControllerType,
    /** For player name, can be empty string if this is dungeon controlled */
    public controllerPlayerName: Username
  ) {
    super();
  }

  makeObservable() {
    makeAutoObservable(this);
  }

  toSerialized() {
    return instanceToPlain(this);
  }

  static fromSerialized(
    serialized: SerializedOf<CombatantControlledBy>,
    combatantProperties: CombatantProperties
  ) {
    const result = plainToInstance(CombatantControlledBy, serialized);
    result.initialize(combatantProperties);
    return result;
  }

  requireOwnedBy(username: Username) {
    if (username !== this.controllerPlayerName) {
      throw new Error(ERROR_MESSAGES.PLAYER.CHARACTER_NOT_OWNED);
    }
  }

  setAiTypes(aiTypes: AiType[]) {
    this.aiTypes = aiTypes;
  }

  getAiTypes() {
    const conditions = this.getCombatantProperties().conditionManager.getConditions();
    const temporaryAiTypes: AiType[] = [];

    for (const condition of conditions) {
      temporaryAiTypes.push(...condition.getAiTypesAppliedToTarget());
    }

    return [...temporaryAiTypes, ...(this.aiTypes || [])];
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

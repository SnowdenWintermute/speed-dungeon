import { plainToInstance } from "class-transformer";
import { makeAutoObservable } from "mobx";
import { EntityId } from "../primatives/index.js";
import { AiType } from "./index.js";

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
    public controllerName: string
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  static getDeserialized(controlledBy: CombatantControlledBy) {
    return plainToInstance(CombatantControlledBy, controlledBy);
  }

  isPlayerControlled() {
    return this.controllerType === CombatantControllerType.Player;
  }

  isDungeonControlled() {
    return this.controllerType === CombatantControllerType.Player;
  }

  wasSummoned() {
    return this.summonedBy !== undefined;
  }
}

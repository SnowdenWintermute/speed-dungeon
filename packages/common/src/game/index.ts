export * from "./player";
export * from "./remove-player-from-party";
import { immerable } from "immer";
import { AdventuringParty } from "../adventuring_party";
import { Battle } from "../battle";
import { EntityId } from "../primatives";
import { IdGenerator } from "./id_generator";
import { SpeedDungeonPlayer } from "./player";
import putPlayerInParty from "./put-player-in-party";
import removePlayerFromParty from "./remove-player-from-party";
import addCharacterToParty from "./add-character-to-party";
import cycleCharacterTargets from "../combat/targeting/cycle-character-targets";
import getAllyIdsAndOpponentIdsOption from "./get-ally-ids-and-opponent-ids-option";
import removePlayerFromGame from "./remove-player-from-game";
import getCharacterInGame from "./get-character-in-game";
import getCombatantInGameById from "./get-combatant-in-game-by-id";

export class SpeedDungeonGame {
  [immerable] = true;
  name: string;
  players: { [username: string]: SpeedDungeonPlayer } = {};
  playersReadied: string[] = [];
  adventuringParties: { [partyName: string]: AdventuringParty } = {};
  battles: { [id: EntityId]: Battle } = {};
  timeStarted: null | number = null;
  idGenerator: IdGenerator = new IdGenerator();
  constructor(name: string) {
    this.name = name;
  }

  static removePlayerFromParty = removePlayerFromParty;
  static removePlayer = removePlayerFromGame;
  static putPlayerInParty = putPlayerInParty;
  static addCharacterToParty = addCharacterToParty;
  static getCharacter = getCharacterInGame;
  static getCombatantById = getCombatantInGameById;
  static cycleCharacterTargets = cycleCharacterTargets;
  static getAllyIdsAndOpponentIdsOption = getAllyIdsAndOpponentIdsOption;
}

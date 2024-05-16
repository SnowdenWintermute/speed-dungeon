export * from "./player";
import { immerable } from "immer";
import { AdventuringParty } from "../adventuring_party";
import { Battle } from "../battle";
import { EntityId } from "../primatives";
import applyFullUpdate from "./apply-full-update";
import { IdGenerator } from "./id_generator";
import { SpeedDungeonPlayer } from "./player";
import putPlayerInParty from "./put-player-in-party";
import removePlayer from "./remove-player-from-game";
import removePlayerFromParty from "./remove-player-from-party";
import addCharacterToParty from "./add-character-to-party";
import getCharacter from "./get-character";

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

  removePlayerFromParty = removePlayerFromParty;
  removePlayer = removePlayer;
  putPlayerInParty = putPlayerInParty;
  applyFullUpdate = applyFullUpdate;
  addCharacterToParty = addCharacterToParty;
  getCharacter = getCharacter;
}

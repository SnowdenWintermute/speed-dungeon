export * from "./player";
import { AdventuringParty } from "../adventuring_party";
import { Battle } from "../battle";
import { EntityId } from "../primatives";
import { IdGenerator } from "./id_generator";
import { SpeedDungeonPlayer } from "./player";
import removePlayer from "./remove-player-from-game";
import removePlayerFromParty from "./remove-player-from-party";

export class SpeedDungeonGame {
  name: string;
  players: Map<string, SpeedDungeonPlayer> = new Map<string, SpeedDungeonPlayer>();
  playersReadied: Set<string> = new Set();
  adventuringParties: Map<string, AdventuringParty> = new Map();
  battles: Map<EntityId, Battle> = new Map();
  timeStarted: null | number = null;
  idGenerator: IdGenerator = new IdGenerator();
  constructor(name: string) {
    this.name = name;
  }

  removePlayerFromParty = removePlayerFromParty;
  removePlayer = removePlayer;
}

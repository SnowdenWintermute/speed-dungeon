export * from "./player";
import { AdventuringParty } from "../adventuring_party";
import { Battle } from "../battle";
import { EntityId } from "../primatives";
import { IdGenerator } from "./id_generator";
import { SpeedDungeonPlayer } from "./player";

export class SpeedDungeonGame {
  name: string;
  players: Map<string, SpeedDungeonPlayer> = new Map<
    string,
    SpeedDungeonPlayer
  >();
  players_readied: Set<string> = new Set();
  adventuring_parties: Map<string, AdventuringParty> = new Map();
  battles: Map<EntityId, Battle> = new Map();
  time_started: number | undefined;
  id_generator: IdGenerator = new IdGenerator();
  constructor(name: string) {
    this.name = name;
  }
}

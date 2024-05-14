import { EntityId, EntityProperties } from "../primatives";
import applyFullUpdate from "./apply-full-update";
import removeCharacter from "./remove-character";

export class PlayerCharacter {
  entityProperties: EntityProperties;
  constructor(
    public nameOfControllingUser: string,

    name: string,
    id: number
  ) {
    this.entityProperties = new EntityProperties(id, name);
  }
}

export class DungeonRoom {
  constructor() {}
}
export enum DungeonRoomType {}

export type RoomsExploredTracker = { total: number; onCurrentFloor: number };

export class AdventuringParty {
  playerUsernames: string[] = [];
  playersReadyToExplore: string[] = [];
  playersReadyToDescend: string[] = [];
  characters: { [id: EntityId]: PlayerCharacter } = {};
  characterPositions: EntityId[] = [];
  currentFloor: number = 1;
  roomsExplored: RoomsExploredTracker = { total: 1, onCurrentFloor: 1 };
  currentRoom: DungeonRoom = new DungeonRoom();
  unexploredRooms: DungeonRoomType[] = [];
  battleId: null | EntityId = null;
  timeOfWipe: null | number = null;
  timeOfEscape: null | number = null;
  itemsOnGroundNotYetReceivedByAllClients: { [id: EntityId]: EntityId[] } = {};

  constructor(public name: string) {}

  applyFullUpdate = applyFullUpdate;
  removeCharacter = removeCharacter;
}

import { EntityId } from "../primatives";
import { VecDeque } from "../vecdeque";
import removeCharacter from "./remove-character";

class PlayerCharacter {}
class DungeonRoom {
  constructor() {}
}
enum DungeonRoomType {}

export type RoomsExploredTracker = { total: number; onCurrentFloor: number };

export class AdventuringParty {
  playerUsernames: Set<string> = new Set();
  playersReadyToExplore: Set<string> = new Set();
  playersReadyToDescend: Set<string> = new Set();
  characters: Map<EntityId, PlayerCharacter> = new Map();
  characterPositions: EntityId[] = [];
  currentFloor: number = 1;
  roomsExplored: RoomsExploredTracker = { total: 1, onCurrentFloor: 1 };
  currentRoom: DungeonRoom = new DungeonRoom();
  unexploredRooms: VecDeque<DungeonRoomType> = new VecDeque();
  battleId: null | EntityId = null;
  timeOfWipe: null | number = null;
  timeOfEscape: null | number = null;
  itemsOnGroundNotYetReceivedByAllClients: Map<EntityId, EntityId[]> =
    new Map();

  constructor(
    public id: EntityId,
    public name: string,
    public websocketChannelName: string
  ) {}

  removeCharacter = removeCharacter;
}

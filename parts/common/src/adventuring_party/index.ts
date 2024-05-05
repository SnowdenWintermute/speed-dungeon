import { EntityId } from "../primatives";
import { VecDeque } from "../vecdeque";

class PlayerCharacter{};
class DungeonRoom{
  constructor(){};
};
enum DungeonRoomType{};

export type RoomsExploredTracker = { total: number, onCurrentFloor: number};

export class AdventuringParty {
  id: EntityId;
  name:string;
  websocketChannelName: string;
  playerUsernames: Set<string> = new Set();
  playersReadyToExplore: Set<string>= new Set();
  playersReadyToDescend: Set<string>= new Set();
  characters: Map<EntityId, PlayerCharacter>= new Map();
  characterPositions: EntityId[] = [];
  currentFloor: number = 1;
  roomsExplored: RoomsExploredTracker = { total: 1, onCurrentFloor: 1};
  currentRoom: DungeonRoom = new DungeonRoom();
  unexploredRooms: VecDeque<DungeonRoomType> = new VecDeque();
  battleId: EntityId | undefined;
  timeOfWipe: number | undefined;
  timeOfEscape: number | undefined;
  itemsOnGroundNotYetReceivedByAllClients: Map<EntityId, EntityId[]> = new Map();

  constructor(id: EntityId, name: string, websocketChannelName:string) {
    this.id = id;
    this.name = name;
    this.websocketChannelName = websocketChannelName;
  }
}

import { AdventuringParty } from "./index.js";
import { EMPTY_ROOMS_PER_FLOOR, GAME_CONFIG } from "../app-consts.js";
import { shuffleArray } from "../utils/index.js";
import { DungeonRoomType } from "./dungeon-room.js";

export function generateUnexploredRoomsQueue(this: AdventuringParty) {
  for (let i = 0; i < GAME_CONFIG.MONSTER_LAIRS_PER_FLOOR; i += 1) {
    this.unexploredRooms.push(DungeonRoomType.MonsterLair);
  }
  for (let i = 0; i < EMPTY_ROOMS_PER_FLOOR; i += 1) {
    this.unexploredRooms.push(DungeonRoomType.Empty);
  }

  shuffleArray(this.unexploredRooms);

  if (this.currentFloor === 1 && this.roomsExplored.total === 0) {
    this.unexploredRooms.push(DungeonRoomType.Empty);
  }
  // this.unexploredRooms.push(DungeonRoomType.VendingMachine); // TESTING

  this.unexploredRooms.unshift(DungeonRoomType.VendingMachine);
  this.unexploredRooms.unshift(DungeonRoomType.Staircase);
}

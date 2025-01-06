import { AdventuringParty } from "./index.js";
import { EMPTY_ROOMS_PER_FLOOR, GAME_CONFIG } from "../app-consts.js";
import { shuffleArray } from "../utils/index.js";
import { DungeonRoomType } from "./dungeon-room.js";

export default function generateUnexploredRoomsQueue(this: AdventuringParty) {
  // this.unexploredRooms = [];
  // for (let i = 0; i < GAME_CONFIG.MONSTER_LAIRS_PER_FLOOR; i += 1) {
  //   this.unexploredRooms.push(DungeonRoomType.MonsterLair);
  // }
  // for (let i = 0; i < EMPTY_ROOMS_PER_FLOOR; i += 1) {
  //   this.unexploredRooms.push(DungeonRoomType.Empty);
  // }
  this.unexploredRooms = [DungeonRoomType.VendingMachine];

  shuffleArray(this.unexploredRooms);

  // @TODO - put this back
  // if (this.currentFloor === 1 && this.roomsExplored.total === 0) {
  //   this.unexploredRooms.push(DungeonRoomType.Empty);
  // }

  this.unexploredRooms.unshift(DungeonRoomType.Staircase);
}

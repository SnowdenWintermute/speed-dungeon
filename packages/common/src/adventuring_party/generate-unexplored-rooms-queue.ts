import { AdventuringParty } from ".";
import { EMPTY_ROOMS_PER_FLOOR, MONSTER_LAIRS_PER_FLOOR } from "../app_consts";
import { shuffleArray } from "../utils";
import { DungeonRoomType } from "./dungeon-room";

export default function generateUnexploredRoomsQueue(this: AdventuringParty) {
  this.unexploredRooms = [];
  for (let i = 0; i < MONSTER_LAIRS_PER_FLOOR; i += 1) {
    this.unexploredRooms.push(DungeonRoomType.MonsterLair);
  }
  for (let i = 0; i < EMPTY_ROOMS_PER_FLOOR; i += 1) {
    this.unexploredRooms.push(DungeonRoomType.Empty);
  }

  shuffleArray(this.unexploredRooms);
  if (this.currentFloor === 1 && this.roomsExplored.total === 0) {
    this.unexploredRooms.push(DungeonRoomType.Empty);
  }

  this.unexploredRooms.unshift(DungeonRoomType.Staircase);
}

import { CombatantClass, Consumable, DungeonRoomType, Equipment } from "@speed-dungeon/common";

export interface CharacterRoomSnapshot {
  characterName: string;
  combatantClass: CombatantClass;
  level: number;
  /** Experience is consumed on level up, so lifetime earned has to be accumulated separately. */
  experienceEarned: number;
  experienceTowardNextLevel: number;
  unspentAttributePoints: number;
  equipped: Equipment[];
}

export interface RoomVisit {
  ordinal: number;
  floorNumber: number;
  roomNumberOnFloor: number;
  roomType: DungeonRoomType;
  characters: CharacterRoomSnapshot[];
  equipmentDropped: Equipment[];
  consumablesDropped: Consumable[];
}

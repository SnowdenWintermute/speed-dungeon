import {
  Combatant,
  CombatantAttributeRecord,
  Consumable,
  DungeonRoomType,
  Equipment,
} from "@speed-dungeon/common";

export interface CharacterRoomSnapshot {
  /** A clone, so metrics can be computed after the walk instead of during it. Only safe to read
   * plain data and prototype methods off: cloneDeep copies arrow-function class properties by
   * reference, so anything reached through one of those still computes against the live character
   * at its end-of-run state. */
  combatant: Combatant;
  /** Read eagerly for exactly that reason — `getTotalAttributes` is one of those arrow-function
   * properties, so off the clone it reports the end of the run at every room. */
  totalAttributes: CombatantAttributeRecord;
  /** Not on the combatant: experience is consumed on level up, so lifetime earned is accumulated
   * separately. */
  experienceEarned: number;
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

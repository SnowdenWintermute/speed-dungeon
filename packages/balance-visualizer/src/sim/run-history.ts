import {
  Combatant,
  CombatantAttributeRecord,
  Consumable,
  DungeonRoomType,
  Equipment,
} from "@speed-dungeon/common";

export interface CharacterRoomSnapshot {
  /** A clone, so metrics can be computed after the walk instead of during it.
   *
   * getTotalAttributes used to be an arrow-function class property, which cloneDeep copies by
   * reference — so off a clone it reported the live character at the end of the run, in every room.
   * It is a prototype method now and the clone answers for itself. Anything else reached through an
   * arrow property still has that problem, so conditions are not safe to read this way. */
  combatant: Combatant;
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

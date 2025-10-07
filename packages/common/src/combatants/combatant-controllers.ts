export enum CombatantControllerType {
  Player,
  Dungeon,
  PlayerPetAI,
}

export interface CombatantControlledBy {
  controllerType: CombatantControllerType;
  /** For player name, can be empty string if this is dungeon controlled */
  controllerName: string;
}

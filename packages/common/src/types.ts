import { AdventuringParty } from "./adventuring-party/index.js";
import { Combatant } from "./combatants/index.js";
import { SpeedDungeonGame } from "./game/index.js";

export interface CharacterAssociatedData {
  username: string;
  game: SpeedDungeonGame;
  party: AdventuringParty;
  character: Combatant;
}

export interface CombatantAssociatedData {
  game: SpeedDungeonGame;
  party: AdventuringParty;
  combatant: Combatant;
}

export interface PlayerAssociatedData {
  username: string;
  game: SpeedDungeonGame;
  party: AdventuringParty;
}

export enum GameMode {
  Race,
  Progression,
}

export function formatGameMode(gameMode: GameMode) {
  switch (gameMode) {
    case GameMode.Race:
      return "Race";
    case GameMode.Progression:
      return "Progression";
  }
}

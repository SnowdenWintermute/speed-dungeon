import { AdventuringParty } from "./adventuring-party/index.js";
import { Combatant } from "./combatants/index.js";
import { SpeedDungeonGame, SpeedDungeonPlayer } from "./game/index.js";

export interface CharacterAssociatedData {
  character: Combatant;
  player: SpeedDungeonPlayer;
  game: SpeedDungeonGame;
  party: AdventuringParty;
}

export interface CombatantAssociatedData {
  game: SpeedDungeonGame;
  party: AdventuringParty;
  combatant: Combatant;
}

export interface PlayerAssociatedData {
  player: SpeedDungeonPlayer;
  game: SpeedDungeonGame;
  partyOption: AdventuringParty | undefined;
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

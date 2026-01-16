import { Combatant } from "./combatants/index.js";
import { AdventuringParty } from "./adventuring-party/index.js";
import { SpeedDungeonGame } from "./game/index.js";
import { SpeedDungeonPlayer } from "./game/player.js";
import { Meters } from "./aliases.js";
import { CombatantSpecies } from "./combatants/combatant-species.js";

export interface CharacterAssociatedData {
  character: Combatant;
  game: SpeedDungeonGame;
  party: AdventuringParty;
  player: SpeedDungeonPlayer;
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

export enum CleanupMode {
  Immediate,
  Soft,
}

export function formatGameMode(gameMode: GameMode) {
  switch (gameMode) {
    case GameMode.Race:
      return "Race";
    case GameMode.Progression:
      return "Progression";
  }
}

export type BoundingBoxSizesBySpecies = Partial<
  Record<
    CombatantSpecies,
    { min: [Meters, Meters, Meters]; max: [Meters, Meters, Meters]; volume: number }
  >
>;

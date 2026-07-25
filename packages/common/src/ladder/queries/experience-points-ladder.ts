import { CombatantId, Username } from "../../aliases.js";
import { CombatantClass } from "../../combatants/combatant-class/classes.js";
import { CharacterControlScheme, GameMode } from "../../game-modes/index.js";

export interface MainClassProgress {
  combatantClass: CombatantClass;
  level: number;
  experience: number;
}

export interface SupportClassProgress {
  combatantClass: CombatantClass;
  level: number;
}

export interface ExperiencePointsLadderQuery {
  page: number;
  // optional filters
  controlSchemeOption?: CharacterControlScheme;
  modeOption?: GameMode;
}

export interface ExperiencePointsLadderViewEntry {
  rank: number;
  characterId: CombatantId;
  characterName: string;
  ownerUsername: Username;
  mainClass: MainClassProgress;
  supportClassOption?: SupportClassProgress;
  mode: GameMode;
  controlScheme: CharacterControlScheme;
}

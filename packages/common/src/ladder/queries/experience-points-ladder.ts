import { CombatantId, Username } from "../../aliases.js";
import { CombatantClass } from "../../combatants/combatant-class/classes.js";
import { CharacterControlScheme, GameMode } from "../../game-modes/index.js";

// main class accrues experience; support class is a flat level with no experience, but shown
// because it is useful context
export interface MainClassProgress {
  combatantClass: CombatantClass;
  level: number;
  experience: number;
}

export interface SupportClassProgress {
  combatantClass: CombatantClass;
  level: number;
}

// an undefined filter means "combined view", not "no results"
export interface ExperiencePointsLadderQuery {
  page: number;
  controlSchemeOption?: CharacterControlScheme;
  modeOption?: GameMode;
}

// experience points, not level: 1-10 is too coarse to rank on. rank reflects the current sort,
// it is not baked into the shape
export interface ExperiencePointsLadderView {
  rank: number;
  characterId: CombatantId;
  characterName: string;
  ownerUsername: Username;
  mainClass: MainClassProgress;
  supportClassOption?: SupportClassProgress;
  mode: GameMode;
  controlScheme: CharacterControlScheme;
}

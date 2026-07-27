import { EntityId, EntityName, Username } from "../../aliases.js";
import { CombatantClass } from "../../combatants/combatant-class/classes.js";
import { CharacterControlScheme } from "../../game-modes/index.js";
import { PagedLadderQuery } from "./ladder-page.js";

export interface MainClassProgress {
  combatantClass: CombatantClass;
  level: number;
  /** progress toward the next level, not the ranking score */
  experiencePoints: number;
}

export interface SupportClassProgress {
  combatantClass: CombatantClass;
  level: number;
}

// each control scheme is its own ladder, so the scheme is what you are looking at rather than a
// filter over some combined ranking. only progression characters are ranked here — ironman and race
// characters belong to a single run, not to the world
export interface ExperiencePointsLadderQuery extends PagedLadderQuery {
  controlScheme: CharacterControlScheme;
}

export interface ExperiencePointsLadderViewEntry {
  rank: number;
  characterId: EntityId;
  characterName: EntityName;
  ownerUsername: Username;
  /** the ranking score: experience accumulated across every level, not just the current one */
  totalExperiencePoints: number;
  mainClass: MainClassProgress;
  supportClassOption?: SupportClassProgress;
}

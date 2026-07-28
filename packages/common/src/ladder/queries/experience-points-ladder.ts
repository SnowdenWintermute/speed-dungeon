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

// a player wants to know where they stand, and their character is almost never on the page anyone is
// looking at. takes a list because a profile asks about every character its owner has at once; a
// character page passes one. the scheme names which board to ask, since a character is only ranked on
// its own
export interface ExperiencePointsLadderRankQuery {
  characterIds: EntityId[];
  controlScheme: CharacterControlScheme;
}

// one progression character wherever it is listed: a row of an experience points ladder, or one of
// the characters on its owner's profile. no control scheme on it — both places that list these ask
// for one scheme at a time, as the ladders themselves are separate
export interface ProgressionCharacterSummaryView {
  characterId: EntityId;
  characterName: EntityName;
  ownerUsername: Username;
  /** the ranking score: experience accumulated across every level, not just the current one */
  totalExperiencePoints: number;
  mainClass: MainClassProgress;
  supportClassOption?: SupportClassProgress;
}

// a player's own characters on one of the two progression ladders. separate queries per scheme for
// the same reason the boards are separate: they are different ladders, and a profile shows a table
// of each rather than one mixed list
export interface PlayerProgressionCharactersQuery {
  username: Username;
  controlScheme: CharacterControlScheme;
}

// the ranks are keyed beside the rows rather than carried on them, as everywhere else: a rank is the
// ladder's answer about a character, and a character no longer on it is simply absent
export interface PlayerProgressionCharactersView {
  characters: ProgressionCharacterSummaryView[];
  ranksByCharacterId: Record<EntityId, number>;
}

// rank is the board's, not the character's, so it is added where a page is formed
export interface ExperiencePointsLadderViewEntry extends ProgressionCharacterSummaryView {
  rank: number;
}

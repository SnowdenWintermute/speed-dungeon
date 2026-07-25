import { CharacterControlScheme, experiencePointsLadderName } from "@speed-dungeon/common";

// the progression games these tests drive are all Captain, and each scheme ranks on its own ladder
export const CAPTAIN_LADDER_NAME = experiencePointsLadderName(CharacterControlScheme.Captain);

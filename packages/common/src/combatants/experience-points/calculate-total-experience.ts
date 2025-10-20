import {
  XP_REQUIRED_TO_LEVEL_INCREASE_INCREMENT,
  XP_REQUIRED_TO_REACH_LEVEL_2,
} from "../../app-consts";

export function calculateTotalExperience(level: number): number {
  if (level < 1) return 0;

  let totalExperience = 0;
  let experienceToNextLevel = XP_REQUIRED_TO_REACH_LEVEL_2;

  for (let currentLevel = 2; currentLevel <= level; currentLevel++) {
    totalExperience += experienceToNextLevel;
    experienceToNextLevel += XP_REQUIRED_TO_LEVEL_INCREASE_INCREMENT;
  }

  return totalExperience;
}

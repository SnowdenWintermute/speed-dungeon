import { CombatantClass } from "@speed-dungeon/common";

// a support class is part of the spec rather than earned during the walk: skill books are the only
// thing that raises one and the loot generator never produces them, so a simulated character would
// otherwise always have none. ClassProgressionProperties.maxSupportClassLevel is the level it tracks
export interface CharacterSpec {
  mainClass: CombatantClass;
  supportClass: null | CombatantClass;
}

export function withoutSupportClass(mainClasses: CombatantClass[]): CharacterSpec[] {
  return mainClasses.map((mainClass) => ({ mainClass, supportClass: null }));
}

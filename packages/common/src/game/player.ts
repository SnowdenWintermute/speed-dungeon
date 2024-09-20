import { immerable } from "immer";
import { FriendOrFoe, TargetingScheme } from "../combat/targeting/index.js";
import { EntityId } from "../primatives/index.js";

export class SpeedDungeonPlayer {
  [immerable] = true;
  partyName: null | string = null;
  characterIds: string[] = [];
  targetPreferences: CombatActionTargetPreferences = new CombatActionTargetPreferences();
  constructor(public username: string) {}
}

export class CombatActionTargetPreferences {
  [immerable] = true;
  friendlySingle: null | EntityId = null;
  hostileSingle: null | EntityId = null;
  category: null | FriendOrFoe = null;
  targetingSchemePreference: TargetingScheme = TargetingScheme.Single;
  constructor() {}
}

import { immerable } from "immer";
import { FriendOrFoe, TargetingScheme } from "../combat/targeting";
import { EntityId } from "../primatives";

export class SpeedDungeonPlayer {
  [immerable] = true;
  partyName: null | string = null;
  // approximation of a HashSet that can be sent over websockets without complex serialization
  characterIds: { [id: string]: null } = {};
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

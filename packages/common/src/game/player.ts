import { FriendOrFoe, TargetingScheme } from "../combat/targeting";
import { EntityId } from "../primatives";

export class SpeedDungeonPlayer {
  partyName: null | string = null;
  // approximation of a HashSet that can be sent over websockets without complex serialization
  characterIds: { [id: number]: null } = {};
  targetPreferences: CombatActionTargetPreferences = new CombatActionTargetPreferences();
  constructor(public username: string) {}
}

export class CombatActionTargetPreferences {
  friendlySingle: null | EntityId = null;
  hostileSingle: null | EntityId = null;
  category: null | FriendOrFoe = null;
  targetingSchemePreference: TargetingScheme = TargetingScheme.Single;
  constructor() {}
}

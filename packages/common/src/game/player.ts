import { FriendOrFoe, TargetingScheme } from "../combat/targeting";
import { EntityId } from "../primatives";

export class SpeedDungeonPlayer {
  socketId: undefined | string; // @TODO - remove this if not used
  partyName: undefined | string;
  characterIds: undefined | Set<EntityId>;
  targetPreferences: CombatActionTargetPreferences =
    new CombatActionTargetPreferences();
  constructor(public username: string) {}
}

export class CombatActionTargetPreferences {
  friendlySingle: undefined | EntityId;
  hostileSingle: undefined | EntityId;
  category: undefined | FriendOrFoe;
  targetingSchemePreference: TargetingScheme = TargetingScheme.Single;
  constructor() {}
}

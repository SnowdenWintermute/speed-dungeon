import { FriendOrFoe } from "../combat/combat-actions/targeting-schemes-and-categories.js";
import { EntityProperties } from "../primatives/entity-properties.js";

export interface ConditionAppliedBy {
  entityProperties: EntityProperties;
  // we store this because at the time a condition is triggered,
  // the entity which originally applied the condition may no longer exist
  // yet we still must figure out the target ids of the condition's triggered
  // action based on its intent and friend or foe status of targets
  // where normally we would just calculate that based off an action user's
  // presence in a certain battle group relative to the target's battle group
  friendOrFoe: FriendOrFoe;
}

export type Username = string & { __brand: "Username" };
export type GameName = string & { __brand: "GameName" };
export type PartyName = string & { __brand: "PartyName" };
export type ProfileId = number & { __brand: "ProfileId" };
export type ChannelName = string & { __brand: "ChannelName" };
export type ConnectionId = string & { __brand: "ConnectionId" };
export type IdentityProviderId = number & { __brand: "IdentityProviderId" };

export type EntityId = string;
export type ItemId = string & { __brand: "ItemId" };
export type CombatantId = string & { __brand: "CombatantId" };
export type ConditionId = EntityId & { __brand: "ConditionId" };

export type Milliseconds = number;
export type Seconds = number;
export type Meters = number;
/** A number relative to 100 */
export type Percentage = number;
/** A number that is expected to be between 0 and 1 */
export type NormalizedPercentage = number;

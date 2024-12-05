import { FriendOrFoe } from "../combat-actions/targeting-schemes-and-categories";

export enum CombatActionTargetType {
  Single,
  Group,
  All,
}

interface CombatActionTargetSingle {
  type: CombatActionTargetType.Single;
  targetId: string;
}

interface CombatActionTargetGroup {
  type: CombatActionTargetType.Group;
  friendOrFoe: FriendOrFoe;
}

interface CombatActionTargetAll {
  type: CombatActionTargetType.All;
}

export type CombatActionTarget =
  | CombatActionTargetSingle
  | CombatActionTargetGroup
  | CombatActionTargetAll;

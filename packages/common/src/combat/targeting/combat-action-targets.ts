import { EntityId } from "../../primatives/index.js";
import { FriendOrFoe } from "../combat-actions/targeting-schemes-and-categories.js";

export enum CombatActionTargetType {
  Single,
  Sides,
  SingleAndSides,
  Group,
  All,
}

interface CombatActionTargetSingle {
  type: CombatActionTargetType.Single;
  targetId: EntityId;
}

interface CombatActionTargetGroup {
  type: CombatActionTargetType.Group;
  friendOrFoe: FriendOrFoe;
}

interface CombatActionTargetAll {
  type: CombatActionTargetType.All;
}

interface CombatActionTargetSingleAndSides {
  type: CombatActionTargetType.SingleAndSides;
  targetId: EntityId;
}

interface CombatActionTargetSides {
  type: CombatActionTargetType.Sides;
  targetId: EntityId;
}

export type CombatActionTarget =
  | CombatActionTargetSingle
  | CombatActionTargetGroup
  | CombatActionTargetAll
  | CombatActionTargetSingleAndSides
  | CombatActionTargetSides;

import { EntityId } from "../../aliases.js";
import { FriendOrFoe } from "../combat-actions/targeting-schemes-and-categories.js";

export enum CombatActionTargetType {
  Single,
  DistinctIds,
  Sides,
  SingleAndSides,
  Group,
  All,
  Environment,
}

export interface CombatActionTargetSingle {
  type: CombatActionTargetType.Single;
  targetId: EntityId;
}

interface CombatActionTargetDistinctIds {
  type: CombatActionTargetType.DistinctIds;
  targetIds: EntityId[];
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
  | CombatActionTargetDistinctIds
  | CombatActionTargetGroup
  | CombatActionTargetAll
  | CombatActionTargetSingleAndSides
  | CombatActionTargetSides;

export function combatActionTargetsAreEqual(a: CombatActionTarget, b: CombatActionTarget): boolean {
  if (a.type !== b.type) return false;

  switch (a.type) {
    case CombatActionTargetType.Single:
      return (b as CombatActionTargetSingle).targetId === a.targetId;

    case CombatActionTargetType.SingleAndSides:
      return (b as CombatActionTargetSingleAndSides).targetId === a.targetId;

    case CombatActionTargetType.Sides:
      return (b as CombatActionTargetSides).targetId === a.targetId;

    case CombatActionTargetType.DistinctIds: {
      const aIds = a.targetIds;
      const bIds = (b as CombatActionTargetDistinctIds).targetIds;
      if (aIds.length !== bIds.length) return false;
      // compare sets ignoring order
      return aIds.every((id) => bIds.includes(id));
    }

    case CombatActionTargetType.Group:
      return (b as CombatActionTargetGroup).friendOrFoe === a.friendOrFoe;

    case CombatActionTargetType.All:
      return true;

    default:
      return false;
  }
}

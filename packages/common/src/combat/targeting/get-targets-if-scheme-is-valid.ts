import { EntityId } from "../../primatives/index.js";
import { FriendOrFoe } from "../combat-actions/targeting-schemes-and-categories.js";
import { CombatActionTarget, CombatActionTargetType } from "./combat-action-targets.js";

export function getActionTargetsIfSchemeIsValid(
  actionTarget: CombatActionTarget,
  idsByDisposition: Record<FriendOrFoe, EntityId[]>
): Error | EntityId[] {
  const allyIds = idsByDisposition[FriendOrFoe.Friendly];
  const opponentIds = idsByDisposition[FriendOrFoe.Hostile];

  switch (actionTarget.type) {
    case CombatActionTargetType.Single:
      return [actionTarget.targetId as EntityId];
    case CombatActionTargetType.DistinctIds:
      return actionTarget.targetIds;
    case CombatActionTargetType.Sides: {
      const targetIds: EntityId[] = [];
      allyIds.forEach((id, i) => {
        if (id === actionTarget.targetId) {
          const prevOption = allyIds[i - 1];
          const nextOption = allyIds[i + 1];
          if (prevOption !== undefined) targetIds.push(prevOption);
          if (nextOption !== undefined) targetIds.push(nextOption);
        }
      });
      opponentIds.forEach((id, i) => {
        if (id === actionTarget.targetId) {
          const prevOption: EntityId | undefined = opponentIds[i - 1];
          const nextOption: EntityId | undefined = opponentIds[i + 1];
          if (prevOption !== undefined) targetIds.push(prevOption as EntityId);
          if (nextOption !== undefined) targetIds.push(nextOption as EntityId);
        }
      });
      return targetIds as EntityId[];
    }
    case CombatActionTargetType.SingleAndSides:
      const targetIds = [actionTarget.targetId as EntityId];
      allyIds.forEach((id, i) => {
        if (id === actionTarget.targetId) {
          const prevOption = allyIds[i - 1];
          const nextOption = allyIds[i + 1];
          if (prevOption !== undefined) targetIds.push(prevOption);
          if (nextOption !== undefined) targetIds.push(nextOption);
        }
      });
      opponentIds.forEach((id, i) => {
        if (id === actionTarget.targetId) {
          const prevOption: EntityId | undefined = opponentIds[i - 1];
          const nextOption: EntityId | undefined = opponentIds[i + 1];
          if (prevOption !== undefined) targetIds.push(prevOption as EntityId);
          if (nextOption !== undefined) targetIds.push(nextOption as EntityId);
        }
      });
      return targetIds as EntityId[];

    case CombatActionTargetType.Group:
      if (actionTarget.friendOrFoe === FriendOrFoe.Friendly) return allyIds;
      else return opponentIds;
    case CombatActionTargetType.All:
      const allCombatantIds: EntityId[] = allyIds.concat(opponentIds);
      return allCombatantIds;
  }
}

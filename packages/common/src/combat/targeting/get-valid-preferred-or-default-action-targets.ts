import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonPlayer } from "../../game/index.js";
import { iterateNumericEnum } from "../../utils/index.js";
import { CombatActionTarget, CombatActionTargetType } from "./combat-action-targets.js";
import {
  FriendOrFoe,
  TargetingScheme,
} from "../combat-actions/targeting-schemes-and-categories.js";
import { IActionUser } from "../../combatant-context/action-user.js";
import { ActionAndRank } from "../../combatant-context/action-user-targeting-properties.js";
import { EntityId } from "../../primatives/index.js";
import { COMBAT_ACTIONS } from "../combat-actions/action-implementations/index.js";

export function getValidPreferredOrDefaultActionTargets(
  actionUser: IActionUser,
  playerOption: null | SpeedDungeonPlayer,
  actionAndRank: ActionAndRank,
  targetIdsByDisposition: Record<FriendOrFoe, EntityId[]>
): Error | CombatActionTarget {
  let newTargets: null | CombatActionTarget = null;

  const { actionName, rank } = actionAndRank;
  const action = COMBAT_ACTIONS[actionName];
  const targetingSchemes = action.targetingProperties.getTargetingSchemes(rank);

  const allyIds = targetIdsByDisposition[FriendOrFoe.Friendly];
  const opponentIds = targetIdsByDisposition[FriendOrFoe.Hostile];

  if (playerOption) {
    const {
      targetingSchemePreference,
      category: preferredCategoryOption,
      hostileSingle: preferredHostileOption,
      friendlySingle: preferredFriendlyOption,
    } = playerOption.targetPreferences;

    // IF SELECTED ACTION CONTAINS PREFERRED TARGETING SCHEME
    if (targetingSchemes.includes(targetingSchemePreference)) {
      switch (targetingSchemePreference) {
        case TargetingScheme.Single:
          // IF PREFERENCE EXISTS SELECT IT IF VALID
          if (preferredCategoryOption !== null) {
            switch (preferredCategoryOption) {
              case FriendOrFoe.Hostile:
                newTargets = getPreferredOrDefaultSingleTargetOption(
                  preferredHostileOption,
                  opponentIds
                );
                break;
              case FriendOrFoe.Friendly:
                newTargets = getPreferredOrDefaultSingleTargetOption(
                  preferredFriendlyOption,
                  allyIds
                );
                break;
            }
          }
          // IF NO VALID PREFERRED SINGLE, GET ANY VALID SINGLE
          for (const category of iterateNumericEnum(FriendOrFoe)) {
            if (newTargets) return newTargets;

            const idsOption = category === FriendOrFoe.Friendly ? allyIds : opponentIds;
            if (idsOption) {
              newTargets = getPreferredOrDefaultSingleTargetOption(idsOption[0] || null, idsOption);
            }
          }
          break;
        case TargetingScheme.Area:
          if (preferredCategoryOption) {
            newTargets = getGroupTargetsOption(allyIds, opponentIds, preferredCategoryOption);
          } else {
            for (const category of iterateNumericEnum(FriendOrFoe)) {
              if (newTargets) return newTargets;
              newTargets = getGroupTargetsOption(allyIds, opponentIds, category);
            }
          }
          break;
        case TargetingScheme.All:
          return { type: CombatActionTargetType.All };
      }
    }

    if (newTargets) {
      return newTargets;
    }
  }

  // IF NO VALID TARGET IN PREFERRED SCHEME OR PREFERRED SCHEME NOT VALID GET ANY VALID TARGET
  const targetingProperties = actionUser.getTargetingProperties();
  const selectedTargetingSchemeOption = targetingProperties.getSelectedTargetingScheme();
  const targetingSchemesToAttemptGettingDefaultTargets = [...targetingSchemes];
  // try the selectedTargetingSchemeOption first, this is how ai combatants will have a "preference" to start with
  if (
    selectedTargetingSchemeOption &&
    targetingSchemesToAttemptGettingDefaultTargets.includes(selectedTargetingSchemeOption)
  ) {
    targetingSchemesToAttemptGettingDefaultTargets.unshift(selectedTargetingSchemeOption);
  }
  for (const targetingSchemeKey of targetingSchemesToAttemptGettingDefaultTargets) {
    const targetingScheme = targetingSchemeKey;

    switch (targetingScheme) {
      case TargetingScheme.Single:
        for (const category of iterateNumericEnum(FriendOrFoe)) {
          const idsOption = category === FriendOrFoe.Friendly ? allyIds : opponentIds;

          if (idsOption)
            newTargets = getPreferredOrDefaultSingleTargetOption(idsOption[0] || null, idsOption);
          if (newTargets) return newTargets;
        }
        break;
      case TargetingScheme.Area:
        for (const category of iterateNumericEnum(FriendOrFoe)) {
          newTargets = getGroupTargetsOption(allyIds, opponentIds, category);
          if (newTargets) return newTargets;
        }
        break;
      case TargetingScheme.All:
        return { type: CombatActionTargetType.All };
    }
  }

  if (newTargets === null) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_VALID_TARGETS);
  return newTargets;
}

function getPreferredOrDefaultSingleTargetOption(
  preferredSingleTargetOption: null | string,
  idsToCheckOption: null | string[]
) {
  let toReturn: null | CombatActionTarget = null;

  if (preferredSingleTargetOption) {
    if (idsToCheckOption) {
      if (idsToCheckOption.includes(preferredSingleTargetOption))
        toReturn = { type: CombatActionTargetType.Single, targetId: preferredSingleTargetOption };
    }
  } else if (idsToCheckOption && idsToCheckOption[0]) {
    toReturn = { type: CombatActionTargetType.Single, targetId: idsToCheckOption[0] };
  }

  return toReturn;
}

function getGroupTargetsOption(
  allyIdsOption: null | string[],
  opponentIdsOption: null | string[],
  category: FriendOrFoe
) {
  switch (category) {
    case FriendOrFoe.Friendly:
      return getGroupTargetIfTargetsExist(allyIdsOption, FriendOrFoe.Friendly);
    case FriendOrFoe.Hostile:
      return getGroupTargetIfTargetsExist(opponentIdsOption, FriendOrFoe.Hostile);
  }
}

function getGroupTargetIfTargetsExist(
  idsOption: null | string[],
  friendOrFoe: FriendOrFoe
): null | CombatActionTarget {
  if (idsOption && idsOption.length > 0) return { type: CombatActionTargetType.Group, friendOrFoe };
  else return null;
}

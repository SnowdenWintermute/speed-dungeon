import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonPlayer } from "../../game/index.js";
import { iterateNumericEnum } from "../../utils/index.js";
import { CombatActionTarget, CombatActionTargetType } from "./combat-action-targets.js";
import {
  FriendOrFoe,
  TargetingScheme,
} from "../combat-actions/targeting-schemes-and-categories.js";
import { CombatActionComponent } from "../combat-actions/index.js";
import { Combatant } from "../../combatants/index.js";

export function getValidPreferredOrDefaultActionTargets(
  combatant: Combatant,
  playerOption: null | SpeedDungeonPlayer,
  combatAction: CombatActionComponent,
  allyIdsOption: null | string[],
  opponentIdsOption: null | string[]
): Error | CombatActionTarget {
  let newTargets: null | CombatActionTarget = null;

  if (!playerOption) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);

  const {
    targetingSchemePreference,
    category: preferredCategoryOption,
    hostileSingle: preferredHostileOption,
    friendlySingle: preferredFriendlyOption,
  } = playerOption.targetPreferences;

  const targetingSchemes = combatAction.targetingProperties.getTargetingSchemes(combatant);

  // IF SELECTED ACTION CONTAINS PREFERRED TARGETING SCHEME
  if (targetingSchemes.includes(targetingSchemePreference)) {
    switch (targetingSchemePreference) {
      case TargetingScheme.Single:
        console.log("SINGLE");
        // IF PREFERENCE EXISTS SELECT IT IF VALID
        if (preferredCategoryOption !== null) {
          switch (preferredCategoryOption) {
            case FriendOrFoe.Hostile:
              newTargets = getPreferredOrDefaultSingleTargetOption(
                preferredHostileOption,
                opponentIdsOption
              );
              break;
            case FriendOrFoe.Friendly:
              newTargets = getPreferredOrDefaultSingleTargetOption(
                preferredFriendlyOption,
                allyIdsOption
              );
              break;
          }
        }
        // IF NO VALID PREFERRED SINGLE, GET ANY VALID SINGLE
        for (const category of iterateNumericEnum(FriendOrFoe)) {
          if (newTargets) return newTargets;

          const idsOption = category === FriendOrFoe.Friendly ? allyIdsOption : opponentIdsOption;
          if (idsOption) {
            newTargets = getPreferredOrDefaultSingleTargetOption(idsOption[0] || null, idsOption);
          }
        }
        break;
      case TargetingScheme.Area:
        console.log("AREA");
        if (preferredCategoryOption) {
          newTargets = getGroupTargetsOption(
            allyIdsOption,
            opponentIdsOption,
            preferredCategoryOption
          );
        } else {
          for (const category of iterateNumericEnum(FriendOrFoe)) {
            if (newTargets) return newTargets;
            newTargets = getGroupTargetsOption(allyIdsOption, opponentIdsOption, category);
          }
        }
        break;
      case TargetingScheme.All:
        console.log("ALL");
        return { type: CombatActionTargetType.All };
    }
  }

  if (newTargets) return newTargets;
  // IF NO VALID TARGET IN PREFERRED SCHEME OR PREFERRED SCHEME NOT VALID GET ANY VALID TARGET
  for (const targetingSchemeKey of targetingSchemes) {
    console.log(combatAction.name, targetingSchemes, targetingSchemeKey);
    const targetingScheme = targetingSchemeKey as TargetingScheme;

    switch (targetingScheme) {
      case TargetingScheme.Single:
        for (const category of iterateNumericEnum(FriendOrFoe)) {
          const idsOption = category === FriendOrFoe.Friendly ? allyIdsOption : opponentIdsOption;
          if (idsOption)
            newTargets = getPreferredOrDefaultSingleTargetOption(idsOption[0] || null, idsOption);
        }
        break;
      case TargetingScheme.Area:
        for (const category of iterateNumericEnum(FriendOrFoe)) {
          newTargets = getGroupTargetsOption(allyIdsOption, opponentIdsOption, category);
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
      else if (idsToCheckOption[0]) {
        toReturn = { type: CombatActionTargetType.Single, targetId: idsToCheckOption[0] };
      }
    }
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

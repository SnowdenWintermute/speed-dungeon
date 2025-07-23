import cloneDeep from "lodash.clonedeep";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonPlayer } from "../../game/index.js";
import {
  CombatActionComponent,
  CombatActionExecutionIntent,
  FriendOrFoe,
  TARGETING_SCHEME_STRINGS,
  TargetingScheme,
} from "../combat-actions/index.js";
import { CombatActionTarget, CombatActionTargetType } from "./combat-action-targets.js";
import {
  filterPossibleTargetIdsByActionTargetCategories,
  filterPossibleTargetIdsByProhibitedCombatantStates,
} from "./filtering.js";
import { getValidPreferredOrDefaultActionTargets } from "./get-valid-preferred-or-default-action-targets.js";
import { EntityId, NextOrPrevious } from "../../primatives/index.js";
import { getActionTargetsIfSchemeIsValid } from "./get-targets-if-scheme-is-valid.js";
import { getCombatantAndSelectedCombatAction } from "../../utils/get-owned-character-and-selected-combat-action.js";
import getNextOrPreviousTarget from "./get-next-or-previous-target.js";
import { CombatantContext } from "../../combatant-context/index.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { COMBAT_ACTIONS } from "../combat-actions/action-implementations/index.js";

export class TargetingCalculator {
  constructor(
    private context: CombatantContext,
    private playerOption: null | SpeedDungeonPlayer
  ) {}

  cycleCharacterTargets(
    characterId: string,
    direction: NextOrPrevious
  ): Error | CombatActionTarget {
    // if (this.playerOption === null) return new Error(ERROR_MESSAGES.PLAYER.NOT_IN_PARTY);
    const characterAndActionDataResult = getCombatantAndSelectedCombatAction(
      this.context.party,
      characterId
    );

    if (characterAndActionDataResult instanceof Error) return characterAndActionDataResult;
    const { character, combatAction, currentTarget } = characterAndActionDataResult;

    const filteredTargetIdsResult = this.getFilteredPotentialTargetIdsForAction(combatAction);
    if (filteredTargetIdsResult instanceof Error) return filteredTargetIdsResult;
    const [allyIdsOption, opponentIdsOption] = filteredTargetIdsResult;

    const newTargetsResult = getNextOrPreviousTarget(
      combatAction,
      currentTarget,
      direction,
      characterId,
      allyIdsOption,
      opponentIdsOption
    );
    if (newTargetsResult instanceof Error) return newTargetsResult;

    if (this.playerOption) {
      const updatedTargetPreferenceResult = this.getUpdatedTargetPreferences(
        combatAction,
        newTargetsResult,
        allyIdsOption,
        opponentIdsOption
      );
      if (updatedTargetPreferenceResult instanceof Error) return updatedTargetPreferenceResult;

      this.playerOption.targetPreferences = updatedTargetPreferenceResult;
    }
    character.combatantProperties.combatActionTarget = newTargetsResult;

    return newTargetsResult;
  }

  cycleCharacterTargetingSchemes(characterId: string): Error | void {
    const characterAndActionDataResult = getCombatantAndSelectedCombatAction(
      this.context.party,
      characterId
    );
    if (characterAndActionDataResult instanceof Error) return characterAndActionDataResult;
    const { character, combatAction } = characterAndActionDataResult;
    const { targetingProperties } = combatAction;
    const targetingSchemes = targetingProperties.getTargetingSchemes(character);

    if (targetingSchemes.length < 2)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.ONLY_ONE_TARGETING_SCHEME_AVAILABLE);

    const lastUsedTargetingScheme = character.combatantProperties.selectedTargetingScheme;

    let newTargetingScheme = lastUsedTargetingScheme;

    if (lastUsedTargetingScheme === null || !targetingSchemes.includes(lastUsedTargetingScheme)) {
      const defaultScheme = targetingSchemes[0];
      if (typeof defaultScheme === "undefined")
        return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGETING_SCHEMES);
      newTargetingScheme = defaultScheme;
    } else {
      const lastUsedTargetingSchemeIndex = targetingSchemes.indexOf(lastUsedTargetingScheme);
      if (lastUsedTargetingSchemeIndex < 0)
        return new Error(ERROR_MESSAGES.CHECKED_EXPECTATION_FAILED);
      const newSchemeIndex =
        lastUsedTargetingSchemeIndex === targetingSchemes.length - 1
          ? 0
          : lastUsedTargetingSchemeIndex + 1;
      newTargetingScheme = targetingSchemes[newSchemeIndex]!;
    }

    // must set targetingScheme here so getValidPreferredOrDefaultActionTargets takes it into account
    character.combatantProperties.selectedTargetingScheme = newTargetingScheme;

    const filteredTargetIdsResult = this.getFilteredPotentialTargetIdsForAction(combatAction);
    if (filteredTargetIdsResult instanceof Error) return filteredTargetIdsResult;
    const [allyIdsOption, opponentIdsOption] = filteredTargetIdsResult;
    const newTargetsResult = this.getValidPreferredOrDefaultActionTargets(
      combatAction,
      allyIdsOption,
      opponentIdsOption
    );
    if (newTargetsResult instanceof Error) return newTargetsResult;

    if (this.playerOption) {
      const updatedTargetPreferenceResult = this.getUpdatedTargetPreferences(
        combatAction,
        newTargetsResult,
        allyIdsOption,
        opponentIdsOption
      );
      if (updatedTargetPreferenceResult instanceof Error) return updatedTargetPreferenceResult;

      this.playerOption.targetPreferences = updatedTargetPreferenceResult;
      this.playerOption.targetPreferences.targetingSchemePreference = newTargetingScheme;
    }

    character.combatantProperties.combatActionTarget = newTargetsResult;
  }

  getCombatActionTargetIds(
    combatAction: CombatActionComponent,
    targets: CombatActionTarget
  ): Error | EntityId[] {
    const { allyIds, opponentIds } = this.context.getAllyAndOpponentIds();
    const { targetingProperties } = combatAction;

    const filteredTargetsResult = filterPossibleTargetIdsByProhibitedCombatantStates(
      this.context.party,
      targetingProperties.prohibitedTargetCombatantStates,
      allyIds,
      opponentIds
    );

    if (filteredTargetsResult instanceof Error) return filteredTargetsResult;
    const [filteredAllyIds, filteredOpponentIdsOption] = filteredTargetsResult;

    const targetEntityIdsResult = getActionTargetsIfSchemeIsValid(
      targets,
      filteredAllyIds,
      filteredOpponentIdsOption
    );

    return targetEntityIdsResult;
  }

  assignInitialCombatantActionTargets(combatActionOption: null | CombatActionComponent) {
    const { combatant } = this.context;
    if (combatActionOption === null) {
      combatant.combatantProperties.selectedCombatAction = null;
      combatant.combatantProperties.combatActionTarget = null;
      return null;
    } else {
      const filteredIdsResult = this.getFilteredPotentialTargetIdsForAction(combatActionOption);
      if (filteredIdsResult instanceof Error) return filteredIdsResult;
      const [allyIdsOption, opponentIdsOption] = filteredIdsResult;
      const newTargetsResult = this.getPreferredOrDefaultActionTargets(combatActionOption);

      if (newTargetsResult instanceof Error) return newTargetsResult;

      if (this.playerOption) {
        const newTargetPreferencesResult = this.getUpdatedTargetPreferences(
          combatActionOption,
          newTargetsResult,
          allyIdsOption,
          opponentIdsOption
        );
        if (newTargetPreferencesResult instanceof Error) return newTargetPreferencesResult;

        this.playerOption.targetPreferences = newTargetPreferencesResult;
        combatant.combatantProperties.selectedTargetingScheme =
          newTargetPreferencesResult.targetingSchemePreference;
      } else {
        const defaultScheme =
          combatActionOption.targetingProperties.getTargetingSchemes(combatant)[0];
        if (defaultScheme === undefined) return new Error("no default targeting scheme found");
        combatant.combatantProperties.selectedTargetingScheme = defaultScheme;
      }

      combatant.combatantProperties.selectedCombatAction = combatActionOption.name;
      combatant.combatantProperties.combatActionTarget = newTargetsResult;
      return newTargetsResult;
    }
  }

  getFilteredPotentialTargetIdsForAction(
    combatAction: CombatActionComponent
  ): Error | [null | string[], null | string[]] {
    const { party, combatant } = this.context;
    const actionUserId = combatant.entityProperties.id;
    const allyAndOpponentIds = this.context.getAllyAndOpponentIds();
    let { allyIds, opponentIds } = allyAndOpponentIds;
    const { targetingProperties } = combatAction;

    const prohibitedTargetCombatantStates = targetingProperties.prohibitedTargetCombatantStates;

    const filteredTargetsResult = filterPossibleTargetIdsByProhibitedCombatantStates(
      party,
      prohibitedTargetCombatantStates,
      allyIds,
      opponentIds
    );
    if (filteredTargetsResult instanceof Error) return filteredTargetsResult;

    [allyIds, opponentIds] = filteredTargetsResult;

    [allyIds, opponentIds] = filterPossibleTargetIdsByActionTargetCategories(
      targetingProperties.validTargetCategories,
      actionUserId,
      allyIds,
      opponentIds
    );

    return [allyIds, opponentIds];
  }

  getValidPreferredOrDefaultActionTargets = (
    combatAction: CombatActionComponent,
    allyIdsOption: null | EntityId[],
    opponentIdsOption: null | EntityId[]
  ) =>
    getValidPreferredOrDefaultActionTargets(
      this.context.combatant,
      this.playerOption,
      combatAction,
      allyIdsOption,
      opponentIdsOption
    );

  getPreferredOrDefaultActionTargets(combatAction: CombatActionComponent) {
    const filteredIdsResult = this.getFilteredPotentialTargetIdsForAction(combatAction);
    if (filteredIdsResult instanceof Error) return filteredIdsResult;
    const [allyIdsOption, opponentIdsOption] = filteredIdsResult;
    const newTargetsResult = this.getValidPreferredOrDefaultActionTargets(
      combatAction,
      allyIdsOption,
      opponentIdsOption
    );

    return newTargetsResult;
  }

  getUpdatedTargetPreferences(
    combatAction: CombatActionComponent,
    newTargets: CombatActionTarget,
    allyIdsOption: null | string[],
    opponentIdsOption: null | string[]
  ) {
    if (!this.playerOption) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
    const newPreferences = cloneDeep(this.playerOption.targetPreferences);
    const { targetingProperties } = combatAction;
    const targetingSchemes = targetingProperties.getTargetingSchemes(this.context.combatant);

    switch (newTargets.type) {
      case CombatActionTargetType.Single:
        const { targetId } = newTargets;
        const isOpponentId = !!opponentIdsOption?.includes(targetId);
        if (isOpponentId) {
          newPreferences.hostileSingle = targetId;
          newPreferences.category = FriendOrFoe.Hostile;
        } else if (allyIdsOption?.includes(targetId)) {
          newPreferences.friendlySingle = targetId;
          newPreferences.category = FriendOrFoe.Friendly;
        }
        break;
      case CombatActionTargetType.Group:
        const category = newTargets.friendOrFoe;
        if (targetingSchemes.length > 1) {
          newPreferences.category = category;
          newPreferences.targetingSchemePreference = TargetingScheme.Area;
        } else {
          // if they had no choice in targeting schemes, don't update their preference
        }
        break;
      case CombatActionTargetType.All:
        if (targetingSchemes.length > 1)
          newPreferences.targetingSchemePreference = TargetingScheme.All;
    }

    return newPreferences;
  }

  getPrimaryTargetCombatantId(actionExecutionIntent: CombatActionExecutionIntent) {
    switch (actionExecutionIntent.targets.type) {
      case CombatActionTargetType.Single:
        return actionExecutionIntent.targets.targetId;
      case CombatActionTargetType.DistinctIds:
      case CombatActionTargetType.Sides:
      case CombatActionTargetType.SingleAndSides:
      case CombatActionTargetType.Group:
      case CombatActionTargetType.All:
        const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
        const targetIdsResult = this.getCombatActionTargetIds(
          action,
          actionExecutionIntent.targets
        );
        if (targetIdsResult instanceof Error) throw targetIdsResult;
        const primaryTargetIdOption = targetIdsResult[0];
        if (primaryTargetIdOption === undefined)
          throw new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGET_PROVIDED);
        return primaryTargetIdOption;
    }
  }

  getPrimaryTargetCombatant(
    party: AdventuringParty,
    actionExecutionIntent: CombatActionExecutionIntent
  ) {
    const primaryTargetIdOption = this.getPrimaryTargetCombatantId(actionExecutionIntent);
    const primaryTargetResult = AdventuringParty.getCombatant(party, primaryTargetIdOption);
    if (primaryTargetResult instanceof Error) return primaryTargetResult;
    return primaryTargetResult;
  }
}

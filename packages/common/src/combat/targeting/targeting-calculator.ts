import cloneDeep from "lodash.clonedeep";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { Combatant } from "../../combatants/index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonGame, SpeedDungeonPlayer } from "../../game/index.js";
import { CombatActionComponent, FriendOrFoe, TargetingScheme } from "../combat-actions/index.js";
import { CombatActionTarget, CombatActionTargetType } from "./combat-action-targets.js";
import {
  filterPossibleTargetIdsByActionTargetCategories,
  filterPossibleTargetIdsByProhibitedCombatantStates,
} from "./filtering.js";
import { getValidPreferredOrDefaultActionTargets } from "./get-valid-preferred-or-default-action-targets.js";
import { EntityId } from "../../primatives/index.js";

export class TargetingCalculator {
  constructor(
    private game: SpeedDungeonGame,
    private party: AdventuringParty,
    private combatant: Combatant,
    private playerOption: null | SpeedDungeonPlayer
  ) {}

  getFilteredPotentialTargetIdsForAction(
    combatAction: CombatActionComponent
  ): Error | [null | string[], null | string[]] {
    const actionUserId = this.combatant.entityProperties.id;
    const allyAndOpponetIdsResult = SpeedDungeonGame.getAllyIdsAndOpponentIdsOption(
      this.game,
      this.party,
      actionUserId
    );
    if (allyAndOpponetIdsResult instanceof Error) return allyAndOpponetIdsResult;
    let allyIdsOption: null | string[] = allyAndOpponetIdsResult.allyIds;
    let opponentIdsOption: null | string[] = allyAndOpponetIdsResult.opponentIdsOption;

    const prohibitedTargetCombatantStates = combatAction.prohibitedTargetCombatantStates;

    const filteredTargetsResult = filterPossibleTargetIdsByProhibitedCombatantStates(
      this.party,
      prohibitedTargetCombatantStates,
      allyIdsOption,
      opponentIdsOption
    );
    if (filteredTargetsResult instanceof Error) return filteredTargetsResult;

    [allyIdsOption, opponentIdsOption] = filteredTargetsResult;

    [allyIdsOption, opponentIdsOption] = filterPossibleTargetIdsByActionTargetCategories(
      combatAction.validTargetCategories,
      actionUserId,
      allyIdsOption,
      opponentIdsOption
    );

    return [allyIdsOption, opponentIdsOption];
  }

  getValidPreferredOrDefaultActionTargets = (
    combatAction: CombatActionComponent,
    allyIdsOption: null | EntityId[],
    opponentIdsOption: null | EntityId[]
  ) =>
    getValidPreferredOrDefaultActionTargets(
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
        if (combatAction.targetingSchemes.length > 1) {
          newPreferences.category = category;
          newPreferences.targetingSchemePreference = TargetingScheme.Area;
        } else {
          // if they had no choice in targeting schemes, don't update their preference
        }
        break;
      case CombatActionTargetType.All:
        if (combatAction.targetingSchemes.length > 1)
          newPreferences.targetingSchemePreference = TargetingScheme.All;
    }

    return newPreferences;
  }
}
import {
  ActionIntentAndUser,
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { BattleConclusionUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { Battle } from "../../battle/index.js";
import { COMBAT_ACTIONS } from "../../combat/combat-actions/action-implementations/index.js";

const stepType = ActionResolutionStepType.BattleResolution;

export class BattleResolutionActionResolutionStep extends ActionResolutionStep {
  branchingActions: ActionIntentAndUser[] = [];

  constructor(context: ActionResolutionStepContext) {
    const { game, party } = context.actionUserContext;
    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];

    let gameUpdateCommandOption: BattleConclusionUpdateCommand | null = null;
    const collectedBranchingActions: ActionIntentAndUser[] = [];

    if (party.battleId !== null) {
      const partyWipes = party.combatantManager.checkForWipes(party.isInCombat());
      const noMonstersInBattle = party.combatantManager.monstersArePresent();
      if (partyWipes.alliesDefeated || partyWipes.opponentsDefeated) {
        const registry = context.manager.sequentialActionManagerRegistry;
        const resolution = Battle.resolveBattle(game, party, registry.lootGenerator, partyWipes);

        registry.battleConcludedOption = {
          conclusion: resolution.conclusion,
          levelUps: resolution.levelUps,
        };

        gameUpdateCommandOption = {
          type: GameUpdateCommandType.BattleConclusion,
          step: stepType,
          actionName: action.name,
          completionOrderId: null,
          partyName: party.name,
          conclusion: resolution.conclusion,
          timestamp: resolution.timestamp,
          loot: resolution.loot,
          experiencePointChanges: resolution.experiencePointChanges,
          removedConditionIds: resolution.removedConditionIds,
          removedCombatantIds: resolution.removedCombatantIds,
          revivedCharacterIds: resolution.revivedCharacterIds,
          actionEntitiesRemoved: resolution.actionEntitiesRemoved,
        };

        collectedBranchingActions.push(...resolution.branchingActions);
      }
    }

    super(stepType, context, gameUpdateCommandOption);
    this.branchingActions = collectedBranchingActions;
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  getBranchingActions = () => this.branchingActions;
}

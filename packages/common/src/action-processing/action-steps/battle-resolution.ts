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
      const partyWipes = party.combatantManager.checkForWipes(party.battleId !== null);
      if (partyWipes.alliesDefeated || partyWipes.opponentsDefeated) {
        const registry = context.manager.sequentialActionManagerRegistry;
        const battle = party.requireBattle(game);
        const resolution = battle.resolveBattle(registry.lootGenerator, partyWipes);
        collectedBranchingActions.push(...resolution.branchingActions);

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
          revivedCharacterIds: resolution.revivedCharacterIds,
          actionEntitiesRemoved: resolution.actionEntitiesRemoved,
        };

        console.log(action.getStringName(), "battle concluded");

        // collectedBranchingActions.push(...resolution.branchingActions);
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

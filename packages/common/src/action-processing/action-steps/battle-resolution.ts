import {
  ActionIntentAndUser,
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { BattleConclusionUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { COMBAT_ACTIONS } from "../../combat/combat-actions/action-implementations/index.js";
import { PartyFateType } from "../../ladder/records/index.js";
import { BattleConclusion } from "../../battle/index.js";

const stepType = ActionResolutionStepType.BattleResolution;

export class BattleResolutionActionResolutionStep extends ActionResolutionStep {
  branchingActions: ActionIntentAndUser[] = [];

  constructor(context: ActionResolutionStepContext) {
    const { game, party } = context.actionUserContext;
    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];

    let gameUpdateCommandOption: BattleConclusionUpdateCommand | null = null;
    const collectedBranchingActions: ActionIntentAndUser[] = [];

    const partyWipes = party.combatantManager.checkForWipes(party.battleId !== null);

    // @TODO - restructure to more cleanly reuse "what happens if a party wipes"
    // because now it is coupled to being in a battle, but a party could wipe outside a battle
    // right now we hack it like this
    if (party.battleId === null && partyWipes.alliesDefeated) {
      party.fate = { type: PartyFateType.Wipe, timestamp: Date.now() };
      const registry = context.manager.sequentialActionManagerRegistry;
      registry.battleConcludedOption = {
        conclusion: BattleConclusion.Defeat,
        levelUps: {},
      };

      gameUpdateCommandOption = {
        type: GameUpdateCommandType.BattleConclusion,
        step: stepType,
        actionName: action.name,
        completionOrderId: null,
        partyName: party.name,
        conclusion: BattleConclusion.Defeat,
        timestamp: Date.now(),
        removedConditionIds: [],
        revivedCharacterIds: [],
        actionEntitiesRemoved: [],
      };
    }

    if (party.battleId !== null) {
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

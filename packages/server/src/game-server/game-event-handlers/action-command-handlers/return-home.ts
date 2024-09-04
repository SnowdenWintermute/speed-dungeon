import {
  AISelectActionAndTarget,
  AdventuringParty,
  Battle,
  CombatAction,
  CombatActionType,
  CombatantTurnTracker,
  ERROR_MESSAGES,
  InputLock,
  ReturnHomeActionCommandPayload,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { GameServer } from "../..";
import checkForWipes from "../combat-action-results-processing/check-for-wipes";

export default function returnHomeActionCommandHandler(
  this: GameServer,
  gameName: string,
  combatantId: string,
  payload: ReturnHomeActionCommandPayload
) {
  const { shouldEndTurn } = payload;
  console.log("processing return home ");
  const actionAssociatedDataResult = this.getGamePartyAndCombatant(gameName, combatantId);
  if (actionAssociatedDataResult instanceof Error) return actionAssociatedDataResult;
  const { game, party, combatant } = actionAssociatedDataResult;
  // SERVER
  // - end the combatant's turn if in battle and action required turn
  console.log("should end turn: ", shouldEndTurn);
  let newActiveCombatantTrackerOption: null | CombatantTurnTracker = null;
  if (party.battleId !== null && shouldEndTurn) {
    const maybeError = SpeedDungeonGame.endActiveCombatantTurn(game, party.battleId);
    if (maybeError instanceof Error) return maybeError;
    newActiveCombatantTrackerOption = maybeError;
  }

  // - check for party wipes and victories and apply/emit them

  const partyWipesResult = checkForWipes(game, combatantId, party.battleId);
  if (partyWipesResult instanceof Error) return partyWipesResult;
  if (partyWipesResult.alliesDefeated || partyWipesResult.opponentsDefeated) {
    // @TODO - handle party wipes
  }

  // - unlock the character's inputs (if in combat they will still be "locked" in the sense it isn't their turn)
  // - we'll let the next player input now, even if it takes a long time to animate this player running home
  //   the clien't shouldn't play the next action until they get back. They can show a "ready up" pose while waiting but
  //   at least they get to put in their inputs
  InputLock.unlockInput(combatant.combatantProperties.inputLock);
  console.log("unlocked input");

  // - if in combat, take ai controlled turn if appropriate
  if (newActiveCombatantTrackerOption !== null) {
    let activeCombatantResult = SpeedDungeonGame.getCombatantById(
      game,
      newActiveCombatantTrackerOption.entityId
    );
    if (activeCombatantResult instanceof Error) return activeCombatantResult;
    let { entityProperties, combatantProperties } = activeCombatantResult;
    const activeCombatantIsAiControlled = combatantProperties.controllingPlayer === null;

    if (activeCombatantIsAiControlled) {
      if (party.battleId === null) return new Error(ERROR_MESSAGES.PARTY.NOT_IN_BATTLE);
      const battleOption = game.battles[party.battleId];
      if (battleOption === undefined) return new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);

      // @TODO - queue action commands for AI if they are the next active combatant
      // - check if active combatant is AI controlled
      // - select their action
      // - get action result
      // - composeActionCommandPayloadsFromActionResults

      const battleGroupsResult = Battle.getAllyAndEnemyBattleGroups(
        battleOption,
        entityProperties.id
      );
      if (battleGroupsResult instanceof Error) return battleGroupsResult;
      const { allyGroup, enemyGroup } = battleGroupsResult;

      const aiSelectedActionAndTargetResult = AISelectActionAndTarget(
        game,
        entityProperties.id,
        allyGroup,
        enemyGroup
      );
      if (aiSelectedActionAndTargetResult instanceof Error) return aiSelectedActionAndTargetResult;
      const { abilityName, target } = aiSelectedActionAndTargetResult;

      const selectedCombatAction: CombatAction = {
        type: CombatActionType.AbilityUsed,
        abilityName,
      };

      this.processSelectedCombatAction(
        game,
        party,
        entityProperties.id,
        selectedCombatAction,
        target,
        battleOption,
        party.characterPositions
      );
    }
  }

  party.actionCommandManager.processNextCommand();
}

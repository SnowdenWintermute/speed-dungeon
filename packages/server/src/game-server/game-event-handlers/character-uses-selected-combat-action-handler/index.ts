import {
  ActionCommandPayload,
  ActionCommandType,
  COMBAT_ACTIONS,
  CharacterAssociatedData,
  CombatActionExecutionIntent,
  CombatActionReplayTreePayload,
  CombatantContext,
  ERROR_MESSAGES,
  InputLock,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../../singletons.js";
import { processCombatAction } from "./process-combat-action.js";
import { actionUseIsValid } from "./action-use-is-valid.js";
import { BattleProcessor } from "./process-battle-until-player-turn-or-conclusion.js";

export async function useSelectedCombatActionHandler(
  _eventData: { characterId: string },
  characterAssociatedData: CharacterAssociatedData
) {
  const { game, party, character, player } = characterAssociatedData;
  const combatantContext = new CombatantContext(game, party, character);
  const gameServer = getGameServer();

  if (InputLock.isLocked(party.inputLock)) return new Error(ERROR_MESSAGES.PARTY.INPUT_IS_LOCKED);

  const { selectedCombatAction } = character.combatantProperties;
  if (selectedCombatAction === null) return new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);

  const targets = character.combatantProperties.combatActionTarget;
  if (targets === null) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGET_PROVIDED);

  // ON RECEIPT
  // validate use
  const action = COMBAT_ACTIONS[selectedCombatAction];
  const actionUseProhibitedMessage = actionUseIsValid(action, targets, combatantContext);

  if (actionUseProhibitedMessage instanceof Error) {
    const playerSocketIdResult = gameServer.getSocketIdOfPlayer(game, player.username);
    if (playerSocketIdResult instanceof Error) return console.error(playerSocketIdResult);
    const playerSocketOption = gameServer.io.sockets.sockets.get(playerSocketIdResult);
    if (!playerSocketOption) return console.error("player socket not found");
    playerSocketOption.emit(ServerToClientEvent.ErrorMessage, actionUseProhibitedMessage.message);
    return;
  }

  const replayTreeResult = processCombatAction(
    new CombatActionExecutionIntent(selectedCombatAction, targets),
    combatantContext
  );

  if (replayTreeResult instanceof Error) return replayTreeResult;

  const battleOption = party.battleId ? game.battles[party.battleId] || null : null;

  const replayTreePayload: CombatActionReplayTreePayload = {
    type: ActionCommandType.CombatActionReplayTree,
    actionUserId: character.entityProperties.id,
    root: replayTreeResult.rootReplayNode,
  };

  const payloads: ActionCommandPayload[] = [replayTreePayload];
  // if they died on their own turn we should not end the active combatant's turn because
  // we would have already removed their turn tracker on death
  if (
    battleOption &&
    replayTreeResult.endedTurn &&
    combatantContext.combatant.combatantProperties.hitPoints > 0
  ) {
    const actionExecutionIntent = new CombatActionExecutionIntent(selectedCombatAction, targets);
    battleOption.turnOrderManager.updateSchedulerWithExecutedActionDelay(
      party,
      actionExecutionIntent.actionName
    );
    battleOption.turnOrderManager.updateTrackers(party);

    payloads.push({
      type: ActionCommandType.AddDelayToFastestActorTurnSchedulerInBattle,
      actionNameOption: actionExecutionIntent.actionName,
    });
  }

  console.log("payloads: ", payloads);

  gameServer.io
    .in(getPartyChannelName(game.name, party.name))
    .emit(ServerToClientEvent.ActionCommandPayloads, payloads);

  if (battleOption) {
    const battleProcessor = new BattleProcessor(gameServer, game, party, battleOption);
    const maybeError = await battleProcessor.processBattleUntilPlayerTurnOrConclusion();
    if (maybeError instanceof Error) return maybeError;
  }
}

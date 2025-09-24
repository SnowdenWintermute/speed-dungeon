import {
  ActionCommandPayload,
  ActionCommandType,
  CharacterAssociatedData,
  CombatActionExecutionIntent,
  CombatActionReplayTreePayload,
  ERROR_MESSAGES,
  InputLock,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../../singletons/index.js";
import { processCombatAction } from "./process-combat-action.js";
import { BattleProcessor } from "./process-battle-until-player-turn-or-conclusion.js";
import { ActionUserContext } from "@speed-dungeon/common";

export async function useSelectedCombatActionHandler(
  _eventData: { characterId: string },
  characterAssociatedData: CharacterAssociatedData
) {
  const { game, player } = characterAssociatedData;
  const gameServer = getGameServer();

  const validTargetsAndActionNameResult = validateClientActionUseRequest(characterAssociatedData);
  if (validTargetsAndActionNameResult instanceof Error) {
    const playerSocketIdResult = gameServer.getSocketIdOfPlayer(game, player.username);
    if (playerSocketIdResult instanceof Error)
      return console.error(validTargetsAndActionNameResult);
    const playerSocketOption = gameServer.io.sockets.sockets.get(playerSocketIdResult);
    if (!playerSocketOption) return console.error("player socket not found");
    playerSocketOption.emit(
      ServerToClientEvent.ErrorMessage,
      validTargetsAndActionNameResult.message
    );
    return;
  }

  const { actionAndRank, targets } = validTargetsAndActionNameResult;

  const { actionName, rank } = actionAndRank;

  const actionExecutionIntent = new CombatActionExecutionIntent(actionName, rank, targets);

  await executeActionAndSendReplayResult(characterAssociatedData, actionExecutionIntent, true);
}

function validateClientActionUseRequest(characterAssociatedData: CharacterAssociatedData) {
  const { game, party, character } = characterAssociatedData;

  if (InputLock.isLocked(party.inputLock)) return new Error(ERROR_MESSAGES.PARTY.INPUT_IS_LOCKED);

  const targetingProperties = character.getTargetingProperties();

  const targets = targetingProperties.getSelectedTarget();
  if (targets === null) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGET_PROVIDED);

  const selectedActionAndRankOption = targetingProperties.getSelectedActionAndRank();
  if (selectedActionAndRankOption === null)
    return new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);

  const maybeError = character.canUseAction(targets, selectedActionAndRankOption, game, party);
  if (maybeError instanceof Error) return maybeError;

  return { actionAndRank: selectedActionAndRankOption, targets };
}

export async function executeActionAndSendReplayResult(
  characterAssociatedData: CharacterAssociatedData,
  actionExecutionIntent: CombatActionExecutionIntent,
  lockInuptWhileReplaying: boolean
) {
  const { game, party, character } = characterAssociatedData;
  const actionUserContext = new ActionUserContext(game, party, character);
  const gameServer = getGameServer();
  const replayTreeResult = processCombatAction(actionExecutionIntent, actionUserContext);

  if (replayTreeResult instanceof Error) return replayTreeResult;

  const battleOption = party.battleId ? game.battles[party.battleId] || null : null;

  const replayTreePayload: CombatActionReplayTreePayload = {
    type: ActionCommandType.CombatActionReplayTree,
    actionUserId: character.entityProperties.id,
    root: replayTreeResult.rootReplayNode,
  };

  if (!lockInuptWhileReplaying) replayTreePayload.doNotLockInput = true;

  const payloads: ActionCommandPayload[] = [replayTreePayload];

  gameServer.io
    .in(getPartyChannelName(game.name, party.name))
    .emit(ServerToClientEvent.ActionCommandPayloads, payloads);

  if (battleOption) {
    const battleProcessor = new BattleProcessor(gameServer, game, party, battleOption);
    const maybeError = await battleProcessor.processBattleUntilPlayerTurnOrConclusion();
    if (maybeError instanceof Error) return maybeError;
  }
}

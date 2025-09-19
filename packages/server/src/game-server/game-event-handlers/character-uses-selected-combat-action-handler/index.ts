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
import { getGameServer } from "../../../singletons/index.js";
import { processCombatAction } from "./process-combat-action.js";
import { BattleProcessor } from "./process-battle-until-player-turn-or-conclusion.js";

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

  const { selectedCombatAction, targets, selectedActionLevel } = validTargetsAndActionNameResult;

  const actionExecutionIntent = new CombatActionExecutionIntent(
    selectedCombatAction,
    targets,
    selectedActionLevel
  );

  await executeActionAndSendReplayResult(characterAssociatedData, actionExecutionIntent, true);
}

function validateClientActionUseRequest(characterAssociatedData: CharacterAssociatedData) {
  const { game, party, character } = characterAssociatedData;
  const combatantContext = new CombatantContext(game, party, character);

  if (InputLock.isLocked(party.inputLock)) return new Error(ERROR_MESSAGES.PARTY.INPUT_IS_LOCKED);

  const { selectedCombatAction } = character.combatantProperties;
  if (selectedCombatAction === null) return new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);

  const targets = character.combatantProperties.combatActionTarget;
  if (targets === null) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGET_PROVIDED);

  const { selectedActionLevel } = character.combatantProperties;
  if (selectedActionLevel === null)
    return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_LEVEL_SELECTED);

  const action = COMBAT_ACTIONS[selectedCombatAction];
  const maybeError = action.useIsValid(targets, selectedActionLevel, combatantContext);
  if (maybeError instanceof Error) return maybeError;

  return { selectedCombatAction, targets, selectedActionLevel };
}

export async function executeActionAndSendReplayResult(
  characterAssociatedData: CharacterAssociatedData,
  actionExecutionIntent: CombatActionExecutionIntent,
  lockInuptWhileReplaying: boolean
) {
  const { game, party, character } = characterAssociatedData;
  const combatantContext = new CombatantContext(game, party, character);
  const gameServer = getGameServer();
  const replayTreeResult = processCombatAction(actionExecutionIntent, combatantContext);

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

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
import { processBattleUntilPlayerTurnOrConclusion } from "./process-battle-until-player-turn-or-conclusion.js";
import { actionUseIsValid } from "./action-use-is-valid.js";

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

  const payload: CombatActionReplayTreePayload = {
    type: ActionCommandType.CombatActionReplayTree,
    actionUserId: character.entityProperties.id,
    root: replayTreeResult.rootReplayNode,
  };

  const payloads: ActionCommandPayload[] = [payload];
  if (replayTreeResult.endedTurn) {
    console.log("sending ended turn payload for human user");
    payloads.push({ type: ActionCommandType.EndActiveCombatantTurn });
  }

  gameServer.io
    .in(getPartyChannelName(game.name, party.name))
    .emit(ServerToClientEvent.ActionCommandPayloads, payloads);

  processBattleUntilPlayerTurnOrConclusion(gameServer, game, party, battleOption);
}

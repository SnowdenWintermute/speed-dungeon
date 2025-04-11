import {
  ActionCommandPayload,
  ActionCommandType,
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

export async function useSelectedCombatActionHandler(
  _eventData: { characterId: string },
  characterAssociatedData: CharacterAssociatedData
) {
  // ON RECEIPT
  // validate use

  const { game, party, character } = characterAssociatedData;
  const combatantContext = new CombatantContext(game, party, character);
  const gameServer = getGameServer();

  if (InputLock.isLocked(party.inputLock)) return new Error(ERROR_MESSAGES.PARTY.INPUT_IS_LOCKED);

  const { selectedCombatAction } = character.combatantProperties;
  if (selectedCombatAction === null) return new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);

  const targets = character.combatantProperties.combatActionTarget;
  if (targets === null) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGET_PROVIDED);

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

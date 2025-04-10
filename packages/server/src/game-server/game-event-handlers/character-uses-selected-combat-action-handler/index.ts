import {
  AISelectActionAndTarget,
  COMBAT_ACTION_NAME_STRINGS,
  CharacterAssociatedData,
  CombatActionExecutionIntent,
  CombatantContext,
  ERROR_MESSAGES,
  InputLock,
  Replayer,
  ServerToClientEvent,
  SpeedDungeonGame,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../../singletons.js";
import { processCombatAction } from "./process-combat-action.js";
import { processBattleUntilPlayerTurnOrConclusion } from "./process-battle-until-player-turn-or-conclusion.js";

export default async function useSelectedCombatActionHandler(
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
  console.log("processed ", COMBAT_ACTION_NAME_STRINGS[selectedCombatAction]);

  // @TODO - process battle until next player turn or completion
  const battleOption = party.battleId ? game.battles[party.battleId] || null : null;
  if (battleOption) {
    const maybeError = SpeedDungeonGame.endActiveCombatantTurn(game, battleOption);
    if (maybeError instanceof Error) return maybeError;
  }

  gameServer.io
    .in(getPartyChannelName(game.name, party.name))
    .emit(ServerToClientEvent.ActionResultReplayTree, {
      actionUserId: character.entityProperties.id,
      replayTree: replayTreeResult,
    });
  processBattleUntilPlayerTurnOrConclusion(gameServer, game, party, battleOption, replayTreeResult);
}

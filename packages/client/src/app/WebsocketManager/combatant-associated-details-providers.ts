import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import {
  CharacterAssociatedData,
  CombatantAssociatedData,
  ERROR_MESSAGES,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { setAlert } from "../components/alerts";
import { AlertState } from "@/stores/alert-store";
import getParty from "@/utils/getParty";

export function characterAssociatedDataProvider(
  mutateGameState: MutateState<GameState>,
  mutateAlertState: MutateState<AlertState>,
  characterId: string,
  fn: (characterAssociatedData: CharacterAssociatedData, gameState: GameState) => Error | void
) {
  mutateGameState((gameState) => {
    if (!gameState.game) return setAlert(mutateAlertState, ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    const { game } = gameState;
    const partyResult = getParty(game, gameState.username);
    if (partyResult instanceof Error) return setAlert(mutateAlertState, partyResult.message);
    const party = partyResult;
    const characterResult = SpeedDungeonGame.getCharacter(game, party.name, characterId);
    if (characterResult instanceof Error)
      return setAlert(mutateAlertState, characterResult.message);
    const character = characterResult;
    const result = fn({ game, character, party }, gameState);
    if (result instanceof Error) return setAlert(mutateAlertState, result.message);
  });
}

export function combatantAssociatedDataProvider(
  mutateGameState: MutateState<GameState>,
  mutateAlertState: MutateState<AlertState>,
  combatantId: string,
  fn: (characterAssociatedData: CombatantAssociatedData, gameState: GameState) => Error | void
) {
  mutateGameState((gameState) => {
    if (!gameState.game) return setAlert(mutateAlertState, ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    const { game } = gameState;
    const partyResult = getParty(game, gameState.username);
    if (partyResult instanceof Error) return setAlert(mutateAlertState, partyResult.message);
    const party = partyResult;
    const combatantResult = SpeedDungeonGame.getCombatantById(game, combatantId);
    if (combatantResult instanceof Error)
      return setAlert(mutateAlertState, combatantResult.message);
    const combatant = combatantResult;
    const result = fn({ game, combatant, party }, gameState);
    if (result instanceof Error) return setAlert(mutateAlertState, result.message);
  });
}

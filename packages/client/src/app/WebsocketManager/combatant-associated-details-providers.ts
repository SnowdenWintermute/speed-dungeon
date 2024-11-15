import { GameState, useGameStore } from "@/stores/game-store";
import {
  CharacterAssociatedData,
  CombatantAssociatedData,
  ERROR_MESSAGES,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { setAlert } from "../components/alerts";
import getParty from "@/utils/getParty";

export function characterAssociatedDataProvider(
  characterId: string,
  fn: (characterAssociatedData: CharacterAssociatedData, gameState: GameState) => Error | void
) {
  useGameStore.getState().mutateState((gameState) => {
    if (!gameState.game) return setAlert(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    const { game } = gameState;
    const partyResult = getParty(game, gameState.username);
    if (partyResult instanceof Error) return setAlert(partyResult.message);
    const party = partyResult;
    const characterResult = SpeedDungeonGame.getCharacter(game, party.name, characterId);
    if (characterResult instanceof Error) return setAlert(characterResult.message);
    const character = characterResult;
    const username = gameState.username;
    if (!username) return setAlert(ERROR_MESSAGES.CLIENT.NO_USERNAME);
    const player = game.players[username];
    if (!player) return setAlert(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
    const result = fn({ game, character, party, player }, gameState);
    if (result instanceof Error) return setAlert(result.message);
  });
}

export function combatantAssociatedDataProvider(
  combatantId: string,
  fn: (characterAssociatedData: CombatantAssociatedData, gameState: GameState) => Error | void
) {
  useGameStore.getState().mutateState((gameState) => {
    if (!gameState.game) return setAlert(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    const { game } = gameState;
    const partyResult = getParty(game, gameState.username);
    if (partyResult instanceof Error) return setAlert(partyResult.message);
    const party = partyResult;
    const combatantResult = SpeedDungeonGame.getCombatantById(game, combatantId);
    if (combatantResult instanceof Error) return setAlert(combatantResult.message);
    const combatant = combatantResult;
    const result = fn({ game, combatant, party }, gameState);
    if (result instanceof Error) return setAlert(result.message);
  });
}

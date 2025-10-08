import { GameState, useGameStore } from "@/stores/game-store";
import {
  CharacterAssociatedData,
  ERROR_MESSAGES,
  PlayerAssociatedData,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { setAlert } from "../components/alerts";
import getParty from "@/utils/getParty";

export function characterAssociatedDataProvider(
  characterId: string,
  fn: (characterAssociatedData: CharacterAssociatedData, gameState: GameState) => Error | void
) {
  useGameStore.getState().mutateState((gameState) => {
    if (!gameState.game) return setAlert(new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME));
    const { game } = gameState;
    const partyResult = getParty(game, gameState.username);
    if (partyResult instanceof Error) return setAlert(partyResult);
    const party = partyResult;
    const characterResult = SpeedDungeonGame.getCombatantById(game, characterId);
    if (characterResult instanceof Error) return setAlert(characterResult);
    const character = characterResult;
    const username = gameState.username;
    if (!username) return setAlert(new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME));
    const player = game.players[username];
    if (!player) return setAlert(new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST));
    const result = fn({ game, character, party, player }, gameState);
    if (result instanceof Error) return setAlert(result);
  });
}

export function playerAssociatedDataProvider(
  username: string,
  fn: (characterAssociatedData: PlayerAssociatedData, gameState: GameState) => Error | void
) {
  const playerName = username;
  useGameStore.getState().mutateState((gameState) => {
    if (!gameState.game) return setAlert(new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME));
    const { game } = gameState;
    const partyResult = getParty(game, playerName);
    if (partyResult instanceof Error) return setAlert(partyResult);
    const party = partyResult;
    const username = gameState.username;
    if (!username) return setAlert(new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME));
    const player = game.players[username];
    if (!player) return setAlert(new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST));
    const result = fn({ game, partyOption: party, player }, gameState);
    if (result instanceof Error) return setAlert(result);
  });
}

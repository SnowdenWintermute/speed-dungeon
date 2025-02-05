import { GameState } from "@/stores/game-store";
import getGameAndParty from "./getGameAndParty";
import getFocusedCharacter from "./getFocusedCharacter";
import {
  AdventuringParty,
  Combatant,
  ERROR_MESSAGES,
  SpeedDungeonGame,
  SpeedDungeonPlayer,
} from "@speed-dungeon/common";

export interface ClientPlayerAssociatedData {
  game: SpeedDungeonGame;
  party: AdventuringParty;
  player: SpeedDungeonPlayer;
  focusedCharacter: Combatant;
}

export default function getClientPlayerAssociatedData(
  gameState: GameState
): Error | ClientPlayerAssociatedData {
  const gameAndPartyResult = getGameAndParty(gameState.game, gameState.username);
  if (gameAndPartyResult instanceof Error) return gameAndPartyResult;
  const [game, party] = gameAndPartyResult;
  const focusedCharacterResult = getFocusedCharacter(gameState);
  if (focusedCharacterResult instanceof Error) return focusedCharacterResult;
  const focusedCharacter = focusedCharacterResult;
  if (!gameState.username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
  const playerOption = game.players[gameState.username];
  if (!playerOption) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);

  return {
    game,
    party,
    player: playerOption,
    focusedCharacter,
  };
}

import { GameState } from "@/stores/game-store";

export default function getCurrentParty(gameState: GameState, username: string) {
  const player = gameState.game?.players[username];
  if (!player?.partyName) return undefined;
  return gameState.game?.adventuringParties[player.partyName];
}

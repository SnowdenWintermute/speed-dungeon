import { useGameStore } from "@/stores/game-store";
import getCurrentParty from "./getCurrentParty";

export function clientUserControlsCombatant(combatantId: string) {
  const gameState = useGameStore.getState();
  const party = getCurrentParty(gameState, gameState.username || "");
  if (!party) return false;
  return party.combatantManager.playerOwnsCharacter(gameState.username || "", combatantId);
}

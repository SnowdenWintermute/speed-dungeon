import { useGameStore } from "@/stores/game-store";
import getCurrentParty from "./getCurrentParty";
import { AdventuringParty } from "@speed-dungeon/common";

export default function clientUserControlsCombatant(combatantId: string) {
  const gameState = useGameStore.getState();
  const party = getCurrentParty(gameState, gameState.username || "");
  if (!party) return false;
  return AdventuringParty.playerOwnsCharacter(party, gameState.username || "", combatantId);
}

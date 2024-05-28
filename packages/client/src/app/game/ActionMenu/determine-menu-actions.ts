import { GameState } from "@/stores/game-store";
import { AdventuringParty } from "@speed-dungeon/common";

export enum MenuTypes {
  InCombat,
  CombatActionSelected,
  OutOfCombat,
  LevelUpAbilities,
  AssignAttributePoints,
  InventoryOpen,
  ViewingEquipedItems,
  ItemSelected,
  ItemsOnGround,
  UnopenedChest,
  Staircase,
}

export default function determineMenuTypes(gameState: GameState, party: AdventuringParty) {
  const menuTypes: MenuType[] = [];
}

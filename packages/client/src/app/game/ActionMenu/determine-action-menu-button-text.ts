import { GameState, MenuContext } from "@/stores/game-store";
import { GameAction, GameActionType } from "./game-actions";
import getParty from "@/utils/getParty";
import { DungeonRoomType, SpeedDungeonGame } from "@speed-dungeon/common";
import getGameAndParty from "@/utils/getGameAndParty";
import {
  CombatActionType,
  ERROR_MESSAGES,
  ItemPropertiesType,
  NextOrPrevious,
  formatAbilityName,
  formatCombatAttribute,
} from "@speed-dungeon/common";

export default function determineActionButtonText(gameState: GameState, action: GameAction) {
  switch (action.type) {
    case GameActionType.ToggleReadyToExplore:
      const partyResult = getParty(gameState.game, gameState.username);
      if (partyResult instanceof Error) return partyResult;
      switch (partyResult.currentRoom.roomType) {
        case DungeonRoomType.Staircase:
          return "Vote to stay";
        default:
          return "Ready to explore";
      }
    case GameActionType.SetInventoryOpen:
      if (action.shouldBeOpen) return "Open inventory";
      else return "Close inventory";
    case GameActionType.ToggleViewingEquipedItems:
      if (gameState.menuContext === MenuContext.Equipment) return "View unequipped items";
      else return "View equipment";
    case GameActionType.SelectItem:
      return determineSelectItemText(gameState, action.itemId, action.stackSize);
    case GameActionType.TakeItem:
      return "Pick up items";
    case GameActionType.UseItem:
      return determineUseItemText(gameState, action.itemId);
    case GameActionType.DropItem:
      return "Drop";
    case GameActionType.DeselectItem:
    case GameActionType.DeselectCombatAction:
      return "Cancel";
    case GameActionType.ToggleReadyToDescend:
      return "Vote to descend";
    case GameActionType.SelectCombatAction:
      switch (action.combatAction.type) {
        case CombatActionType.AbilityUsed:
          return formatAbilityName(action.combatAction.abilityName);
        case CombatActionType.ConsumableUsed:
          return "Use";
      }
    case GameActionType.ShardItem:
      return "Convert to shard";
    case GameActionType.UseSelectedCombatAction:
      return "Execute";
    case GameActionType.CycleTargets:
      switch (action.nextOrPrevious) {
        case NextOrPrevious.Next:
          return "Next target";
        case NextOrPrevious.Previous:
          return "Previous target";
      }
    case GameActionType.CycleTargetingScheme:
      return "Targeting scheme";
    case GameActionType.SetAssignAttributePointsMenuOpen:
      return "Assign attributes";
    case GameActionType.AssignAttributePoint:
      return formatCombatAttribute(action.attribute);
  }
}

function determineSelectItemText(
  gameState: GameState,
  itemId: string,
  numberOfThisItemInInventory: number
) {
  const gameAndPartyResult = getGameAndParty(gameState.game, gameState.username);
  if (gameAndPartyResult instanceof Error) return gameAndPartyResult;
  const [game, party] = gameAndPartyResult;
  const characterResult = SpeedDungeonGame.getCharacter(
    game,
    party.name,
    gameState.focusedCharacterId
  );
  if (characterResult instanceof Error) return characterResult;
  const combatantProperties = characterResult.combatantProperties;

  for (const equipment of Object.values(combatantProperties.equipment)) {
    if (equipment.entityProperties.id === itemId) return equipment.entityProperties.name;
  }

  let itemName = "";
  for (const item of combatantProperties.inventory.items) {
    if (item.entityProperties.id === itemId) itemName = item.entityProperties.name;
  }

  if (numberOfThisItemInInventory) itemName += ` (${numberOfThisItemInInventory})`;

  return itemName;
}

function determineUseItemText(gameState: GameState, itemId: string) {
  const gameAndPartyResult = getGameAndParty(gameState.game, gameState.username);
  if (gameAndPartyResult instanceof Error) return gameAndPartyResult;
  const [game, party] = gameAndPartyResult;
  const characterResult = SpeedDungeonGame.getCharacter(
    game,
    party.name,
    gameState.focusedCharacterId
  );
  if (characterResult instanceof Error) return characterResult;
  const combatantProperties = characterResult.combatantProperties;

  for (const equipment of Object.values(combatantProperties.equipment)) {
    if (equipment.entityProperties.id === itemId) return "Unequip";
  }

  for (const item of combatantProperties.inventory.items) {
    if (item.entityProperties.id === itemId) {
      switch (item.itemProperties.type) {
        case ItemPropertiesType.Equipment:
          return "Equip";
        case ItemPropertiesType.Consumable:
          return "Use";
      }
    }
  }

  return new Error(ERROR_MESSAGES.ITEM.NOT_FOUND);
}

import { GameState } from "@/stores/game-store";
import { UIState } from "@/stores/ui-store";
import { GameAction, GameActionType } from "./game-actions";
import {
  AdventuringParty,
  CombatActionType,
  CombatantAbilityName,
  CombatantProperties,
  ERROR_MESSAGES,
} from "@speed-dungeon/common";
import getCurrentParty from "@/utils/getCurrentParty";

export default function actionButtonShouldBeDisabled(
  gameState: GameState,
  uiState: UIState,
  action: GameAction
) {
  if (!gameState.username) return console.error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
  const partyOption = getCurrentParty(gameState, gameState.username);
  if (!partyOption) return console.error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
  const playerOwnsCharacter = AdventuringParty.playerOwnsCharacter(
    partyOption,
    gameState.username,
    gameState.focusedCharacterId
  );

  let shouldBeDisabled = false;
  switch (action.type) {
    case GameActionType.ToggleReadyToExplore:
    case GameActionType.ToggleReadyToDescend:
    case GameActionType.SetInventoryOpen:
    case GameActionType.ToggleViewingEquipedItems:
    case GameActionType.SetAssignAttributePointsMenuOpen:
      break;
    case GameActionType.SelectItem:
    case GameActionType.TakeItem:
    case GameActionType.UseItem:
    case GameActionType.DropItem:
    case GameActionType.ShardItem:
    case GameActionType.DeselectItem:
    case GameActionType.DeselectCombatAction:
    case GameActionType.CycleTargets:
    case GameActionType.CycleTargetingScheme:
    case GameActionType.AssignAttributePoint:
    case GameActionType.UseSelectedCombatAction:
    case GameActionType.SelectCombatAction:
      shouldBeDisabled = !playerOwnsCharacter;
  }

  if (shouldBeDisabled) return shouldBeDisabled;

  const focusedCharacterResult = gameState.getFocusedCharacter();
  if (focusedCharacterResult instanceof Error) return console.error(focusedCharacterResult);
  let abilityNameOption: null | CombatantAbilityName = null;

  switch (action.type) {
    case GameActionType.UseSelectedCombatAction:
      if (
        focusedCharacterResult.combatantProperties.selectedCombatAction?.type ===
        CombatActionType.AbilityUsed
      ) {
        abilityNameOption =
          focusedCharacterResult.combatantProperties.selectedCombatAction.abilityName;
      }
      break;
    case GameActionType.SelectCombatAction:
      switch (action.combatAction.type) {
        case CombatActionType.AbilityUsed:
          abilityNameOption = action.combatAction.abilityName;
          break;
        case CombatActionType.ConsumableUsed:
          break;
      }
      break;
    default:
  }

  if (abilityNameOption === null) return shouldBeDisabled;

  const abilityCostResult = CombatantProperties.getAbilityCostIfOwned(
    focusedCharacterResult.combatantProperties,
    abilityNameOption
  );
  if (abilityCostResult instanceof Error) return console.error(abilityCostResult);
  if (abilityCostResult > focusedCharacterResult.combatantProperties.mana) return true;
  return shouldBeDisabled;
}

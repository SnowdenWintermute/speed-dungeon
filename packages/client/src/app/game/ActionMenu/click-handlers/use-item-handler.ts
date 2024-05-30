import { GameState } from "@/stores/game-store";
import { LobbyState } from "@/stores/lobby-store";
import { UIState } from "@/stores/ui-store";
import { PartyClientSocket } from "@/stores/websocket-store";
import { ItemPropertiesType } from "@speed-dungeon/common";

export default function useItemHandler(
  gameState: GameState,
  uiState: UIState,
  lobbyState: LobbyState,
  partySockeOption: PartyClientSocket
) {
  const altSlotTargeted = uiState.modKeyHeld;
  const characterId = gameState.focusedCharacterId;
  const itemOption = gameState.selectedItem;
  if (itemOption) {
    switch (itemOption.itemProperties.type) {
      case ItemPropertiesType.Equipment:
      // useEquipmentHandler()
      case ItemPropertiesType.Consumable:
      // selectCombatActionHandler();
    }
  }
}

function useEquipmentHandler(gameState: GameState, partySocket: PartyClientSocket);

import { CharacterAssociatedData, CombatantEquipment, ERROR_MESSAGES } from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { GameState } from "@/stores/game-store";

export default function characterSelectedHoldableHotswapSlotHandler(
  characterId: string,
  slotIndex: number
) {
  characterAssociatedDataProvider(
    characterId,
    ({ character }: CharacterAssociatedData, gameState: GameState) => {
      if (
        slotIndex >=
        CombatantEquipment.getHoldableHotswapSlots(character.combatantProperties).length
      )
        return new Error(ERROR_MESSAGES.EQUIPMENT.SELECTED_SLOT_OUT_OF_BOUNDS);

      console.log("character ", character.entityProperties.name, "selecting index: ", slotIndex);
      character.combatantProperties.equipment.equippedHoldableHotswapSlotIndex = slotIndex;
    }
  );
}

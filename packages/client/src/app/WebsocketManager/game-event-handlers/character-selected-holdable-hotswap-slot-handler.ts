import {
  CharacterAssociatedData,
  CombatantEquipment,
  ERROR_MESSAGES,
  EquipmentSlotType,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { GameState } from "@/stores/game-store";
import { gameWorld } from "@/app/3d-world/SceneManager";
import { ModelManagerMessageType } from "@/app/3d-world/game-world/model-manager";

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

      const { combatantProperties } = character;
      const { equipment } = combatantProperties;

      const slotSwitchingAwayFrom =
        CombatantEquipment.getEquippedHoldableSlots(combatantProperties);
      if (!slotSwitchingAwayFrom)
        return new Error(ERROR_MESSAGES.EQUIPMENT.SELECTED_SLOT_OUT_OF_BOUNDS);

      equipment.equippedHoldableHotswapSlotIndex = slotIndex;

      // if newly equipped items don't have models, spawn them
      const newlySelectedSlot = CombatantEquipment.getEquippedHoldableSlots(combatantProperties);
      if (newlySelectedSlot === undefined)
        return new Error(ERROR_MESSAGES.EQUIPMENT.SELECTED_SLOT_OUT_OF_BOUNDS);

      // enqueue model managment message
    }
  );
}

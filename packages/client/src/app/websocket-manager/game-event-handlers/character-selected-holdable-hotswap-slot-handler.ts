import {
  CharacterAssociatedData,
  CombatantEquipment,
  ERROR_MESSAGES,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { GameState } from "@/stores/game-store";
import { getGameWorld } from "@/app/3d-world/SceneManager";
import { changeSelectedHotswapSlot } from "@speed-dungeon/common";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";
import { AppStore } from "@/mobx-stores/app-store";

export function characterSelectedHoldableHotswapSlotHandler(
  characterId: string,
  slotIndex: number
) {
  characterAssociatedDataProvider(
    characterId,
    ({ game, party, character }: CharacterAssociatedData, gameState: GameState) => {
      const { equipment } = character.combatantProperties;

      if (slotIndex >= CombatantEquipment.getHoldableHotswapSlots(equipment).length)
        return new Error(ERROR_MESSAGES.EQUIPMENT.SELECTED_SLOT_OUT_OF_BOUNDS);

      const slotSwitchingAwayFrom = CombatantEquipment.getEquippedHoldableSlots(equipment);
      if (!slotSwitchingAwayFrom)
        return new Error(ERROR_MESSAGES.EQUIPMENT.SELECTED_SLOT_OUT_OF_BOUNDS);

      const { focusStore } = AppStore.get();
      // if hovering equipped item we don't want to show the previously held item anymore since it is no longer
      // under the cursor, instead mark it such that we want to now hover the new item, if any exists
      let previouslyHoveredSlotTypeOption = null;
      for (const [slotType, equipment] of iterateNumericEnumKeyedRecord(
        slotSwitchingAwayFrom.holdables
      )) {
        if (focusStore.entityIsHovered(equipment.entityProperties.id))
          previouslyHoveredSlotTypeOption = slotType;
      }

      changeSelectedHotswapSlot(character.combatantProperties, slotIndex);

      if (previouslyHoveredSlotTypeOption !== null) {
        focusStore.detailable.clearHovered();
        const newlyEquippedSlotOption = CombatantEquipment.getEquippedHoldableSlots(equipment);
        if (newlyEquippedSlotOption) {
          for (const [slotType, holdable] of iterateNumericEnumKeyedRecord(
            newlyEquippedSlotOption.holdables
          )) {
            if (slotType === previouslyHoveredSlotTypeOption)
              focusStore.detailable.setHovered(holdable);
          }
        }
      }

      getGameWorld().modelManager.modelActionQueue.enqueueMessage({
        type: ModelActionType.SynchronizeCombatantEquipmentModels,
        entityId: character.entityProperties.id,
      });
    }
  );
}

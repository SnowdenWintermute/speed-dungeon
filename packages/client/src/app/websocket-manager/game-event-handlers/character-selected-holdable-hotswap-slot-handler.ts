import {
  CharacterAssociatedData,
  ERROR_MESSAGES,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { AppStore } from "@/mobx-stores/app-store";
import { getGameWorldView } from "@/app/game-world-view-canvas/SceneManager";
import { ModelActionType } from "@/game-world-view/model-manager/model-actions";

export function characterSelectedHoldableHotswapSlotHandler(
  characterId: string,
  slotIndex: number
) {
  characterAssociatedDataProvider(characterId, ({ character }: CharacterAssociatedData) => {
    const { equipment } = character.combatantProperties;

    if (slotIndex >= equipment.getHoldableHotswapSlots().length) {
      return new Error(ERROR_MESSAGES.EQUIPMENT.SELECTED_SLOT_OUT_OF_BOUNDS);
    }

    const slotSwitchingAwayFrom = equipment.getActiveHoldableSlot();
    if (!slotSwitchingAwayFrom) {
      throw new Error(ERROR_MESSAGES.EQUIPMENT.SELECTED_SLOT_OUT_OF_BOUNDS);
    }

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

    character.combatantProperties.equipment.changeSelectedHotswapSlot(slotIndex);

    if (previouslyHoveredSlotTypeOption !== null) {
      focusStore.detailables.clearHovered();
      const newlyEquippedSlotOption = equipment.getActiveHoldableSlot();
      if (newlyEquippedSlotOption) {
        for (const [slotType, holdable] of iterateNumericEnumKeyedRecord(
          newlyEquippedSlotOption.holdables
        )) {
          if (slotType === previouslyHoveredSlotTypeOption)
            focusStore.detailables.setHovered(holdable);
        }
      }
    }

    getGameWorldView().modelManager.modelActionQueue.enqueueMessage({
      type: ModelActionType.SynchronizeCombatantEquipmentModels,
      entityId: character.entityProperties.id,
    });
  });
}

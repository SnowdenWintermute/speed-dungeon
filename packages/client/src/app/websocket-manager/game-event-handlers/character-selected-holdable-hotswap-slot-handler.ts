import {
  CharacterAssociatedData,
  CombatantEquipment,
  ERROR_MESSAGES,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { GameState } from "@/stores/game-store";
import { gameWorld } from "@/app/3d-world/SceneManager";
import cloneDeep from "lodash.clonedeep";
import { changeSelectedHotswapSlot } from "@speed-dungeon/common";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";

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

      const slotSwitchingAwayFrom =
        CombatantEquipment.getEquippedHoldableSlots(combatantProperties);
      if (!slotSwitchingAwayFrom)
        return new Error(ERROR_MESSAGES.EQUIPMENT.SELECTED_SLOT_OUT_OF_BOUNDS);

      // if hovering equipped item we don't want to show the previously held item anymore since it is no longer
      // under the cursor, instead mark it such that we want to now hover the new item, if any exists
      let previouslyHoveredSlotTypeOption = null;
      for (const [slotType, equipment] of iterateNumericEnumKeyedRecord(
        slotSwitchingAwayFrom.holdables
      )) {
        if (equipment.entityProperties.id === gameState.hoveredEntity?.entityProperties.id)
          previouslyHoveredSlotTypeOption = slotType;
      }

      changeSelectedHotswapSlot(character.combatantProperties, slotIndex);

      if (previouslyHoveredSlotTypeOption !== null) {
        gameState.hoveredEntity = null;
        const newlyEquippedSlotOption = CombatantEquipment.getEquippedHoldableSlots(
          character.combatantProperties
        );
        if (newlyEquippedSlotOption) {
          for (const [slotType, holdable] of iterateNumericEnumKeyedRecord(
            newlyEquippedSlotOption.holdables
          )) {
            if (slotType === previouslyHoveredSlotTypeOption) gameState.hoveredEntity = holdable;
          }
        }
      }

      // if newly equipped items don't have models, spawn them
      const newlySelectedSlot = CombatantEquipment.getEquippedHoldableSlots(combatantProperties);
      if (newlySelectedSlot === undefined)
        return new Error(ERROR_MESSAGES.EQUIPMENT.SELECTED_SLOT_OUT_OF_BOUNDS);

      // enqueue model managment message
      gameWorld.current?.modelManager.modelActionQueue.enqueueMessage({
        type: ModelActionType.SelectHotswapSlot,
        entityId: character.entityProperties.id,
        hotswapSlots: cloneDeep(
          CombatantEquipment.getHoldableHotswapSlots(character.combatantProperties)
        ),
        selectedIndex: character.combatantProperties.equipment.equippedHoldableHotswapSlotIndex,
      });
    }
  );
}

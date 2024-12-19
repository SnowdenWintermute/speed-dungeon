import { CharacterAssociatedData, CombatantEquipment, ERROR_MESSAGES } from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { GameState } from "@/stores/game-store";
import { gameWorld } from "@/app/3d-world/SceneManager";
import { ModelManagerMessageType } from "@/app/3d-world/game-world/model-manager";
import cloneDeep from "lodash.clonedeep";
import { changeSelectedHotswapSlot } from "@speed-dungeon/common";

export default function characterSelectedHoldableHotswapSlotHandler(
  characterId: string,
  slotIndex: number
) {
  characterAssociatedDataProvider(
    characterId,
    ({ character }: CharacterAssociatedData, _gameState: GameState) => {
      if (
        slotIndex >=
        CombatantEquipment.getHoldableHotswapSlots(character.combatantProperties).length
      )
        return new Error(ERROR_MESSAGES.EQUIPMENT.SELECTED_SLOT_OUT_OF_BOUNDS);

      const { combatantProperties } = character;

      const oldIndex = combatantProperties.equipment.equippedHoldableHotswapSlotIndex;
      const slotSwitchingAwayFrom =
        CombatantEquipment.getEquippedHoldableSlots(combatantProperties);
      if (!slotSwitchingAwayFrom)
        return new Error(ERROR_MESSAGES.EQUIPMENT.SELECTED_SLOT_OUT_OF_BOUNDS);

      changeSelectedHotswapSlot(character.combatantProperties, slotIndex);

      // if newly equipped items don't have models, spawn them
      const newlySelectedSlot = CombatantEquipment.getEquippedHoldableSlots(combatantProperties);
      if (newlySelectedSlot === undefined)
        return new Error(ERROR_MESSAGES.EQUIPMENT.SELECTED_SLOT_OUT_OF_BOUNDS);

      // enqueue model managment message
      gameWorld.current?.modelManager.enqueueMessage(character.entityProperties.id, {
        type: ModelManagerMessageType.SelectHotswapSlot,
        hotswapSlots: cloneDeep(
          CombatantEquipment.getHoldableHotswapSlots(character.combatantProperties)
        ),
        selectedIndex: character.combatantProperties.equipment.equippedHoldableHotswapSlotIndex,
      });
    }
  );
}

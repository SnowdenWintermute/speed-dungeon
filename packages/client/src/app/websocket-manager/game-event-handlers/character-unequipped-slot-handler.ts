import {
  CharacterAndSlot,
  CharacterAssociatedData,
  CombatantProperties,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { gameWorld } from "@/app/3d-world/SceneManager";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";

export function characterUnequippedSlotHandler(characterAndSlot: CharacterAndSlot) {
  const { characterId, slot } = characterAndSlot;

  characterAssociatedDataProvider(characterId, ({ character }: CharacterAssociatedData) => {
    CombatantProperties.unequipSlots(character.combatantProperties, [slot]);

    gameWorld.current?.modelManager.modelActionQueue.enqueueMessage({
      type: ModelActionType.ChangeEquipment,
      entityId: characterId,
      unequippedSlot: slot,
    });
  });
}

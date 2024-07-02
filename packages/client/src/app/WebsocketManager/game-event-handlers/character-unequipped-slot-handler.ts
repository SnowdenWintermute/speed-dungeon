import {
  CharacterAndSlot,
  CharacterAssociatedData,
  CombatantProperties,
} from "@speed-dungeon/common";
import clientCharacterActionHandler from "../client-character-action-handler";
import { MutateState } from "@/stores/mutate-state";
import { GameState } from "@/stores/game-store";
import { AlertState } from "@/stores/alert-store";

export default function characterUnequippedSlotHandler(
  mutateGameState: MutateState<GameState>,
  mutateAlertState: MutateState<AlertState>,
  characterAndSlot: CharacterAndSlot
) {
  const { characterId, slot } = characterAndSlot;

  clientCharacterActionHandler(
    mutateGameState,
    mutateAlertState,
    characterId,
    ({ character }: CharacterAssociatedData) => {
      const _itemDroppedIds = CombatantProperties.unequipSlots(character.combatantProperties, [
        slot,
      ]);
    }
  );
}

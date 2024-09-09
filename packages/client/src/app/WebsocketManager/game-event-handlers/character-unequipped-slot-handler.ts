import {
  CharacterAndSlot,
  CharacterAssociatedData,
  CombatantProperties,
} from "@speed-dungeon/common";
import { MutateState } from "@/stores/mutate-state";
import { GameState } from "@/stores/game-store";
import { AlertState } from "@/stores/alert-store";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";

export default function characterUnequippedSlotHandler(
  mutateGameState: MutateState<GameState>,
  mutateAlertState: MutateState<AlertState>,
  characterAndSlot: CharacterAndSlot
) {
  const { characterId, slot } = characterAndSlot;

  characterAssociatedDataProvider(
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

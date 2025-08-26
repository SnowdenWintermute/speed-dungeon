import {
  AbilityTreeAbility,
  CharacterAssociatedData,
  CombatantAbilityProperties,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { GameState } from "@/stores/game-store";

export function characterAllocatedAbilityPointHandler(eventData: {
  characterId: string;
  ability: AbilityTreeAbility;
}) {
  const { characterId, ability } = eventData;
  characterAssociatedDataProvider(
    characterId,
    ({ character }: CharacterAssociatedData, gameState: GameState) => {
      CombatantAbilityProperties.allocateAbilityPoint(character.combatantProperties, ability);
    }
  );
}

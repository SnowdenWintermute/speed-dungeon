import { useGameStore } from "@/stores/game-store";
import {
  CombatAttribute,
  Combatant,
  CombatantProperties,
  Item,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import React, { useEffect, useMemo } from "react";

export default function CurrentItemUnmetRequirementsUpdater() {
  const focusedCharacterResult = useGameStore().getFocusedCharacter();
  const hoveredEntity = useGameStore().hoveredEntity;
  const detailedEntity = useGameStore().detailedEntity;
  const mutateGameState = useGameStore().mutateState;

  const unmetRequiremnts = useMemo(() => {
    if (focusedCharacterResult instanceof Error) return null;

    let focusedItem = null;
    if (hoveredEntity instanceof Item) focusedItem = hoveredEntity;
    else if (detailedEntity instanceof Item) focusedItem = detailedEntity;

    if (focusedItem === null) return null;

    const unmet = caluclateUnmetItemRequirements(focusedCharacterResult, focusedItem);
    return unmet;
  }, [hoveredEntity, detailedEntity, focusedCharacterResult]);

  useEffect(() => {
    mutateGameState((state) => {
      state.consideredItemUnmetRequirements = unmetRequiremnts;
    });
  }, [unmetRequiremnts]);

  function caluclateUnmetItemRequirements(character: Combatant, item: Item) {
    // calculate unmet requirements
    const totalAttributes = CombatantProperties.getTotalAttributes(character.combatantProperties);

    const unmetAttributeRequirements: CombatAttribute[] = [];
    if (Object.keys(item.requirements).length !== 0) {
      for (const [attribute, value] of iterateNumericEnumKeyedRecord(item.requirements)) {
        const characterAttribute = totalAttributes[attribute] || 0;
        if (characterAttribute >= value) continue;
        else unmetAttributeRequirements.push(attribute);
      }
    }

    if (unmetAttributeRequirements.length > 0) return unmetAttributeRequirements;
    else return null;
  }
  return <div />;
}

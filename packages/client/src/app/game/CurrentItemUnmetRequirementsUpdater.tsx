import React, { useEffect, useMemo } from "react";
import { useGameStore } from "@/stores/game-store";
import { CombatAttribute, Combatant, CombatantProperties, Item } from "@speed-dungeon/common";

export default function CurrentItemUnmetRequirementsUpdater() {
  const focusedCharacterResult = useGameStore().getFocusedCharacter();
  const mutateGameStore = useGameStore().mutateState;
  const detailedEntity = useGameStore.getState().detailedEntity;
  const hoveredEntity = useGameStore.getState().hoveredEntity;

  const unmetRequirements = useMemo(() => {
    if (focusedCharacterResult instanceof Error) return null;

    let focusedItem = null;
    if (hoveredEntity instanceof Item) focusedItem = hoveredEntity;
    else if (detailedEntity instanceof Item) focusedItem = detailedEntity;
    console.log("focusedItem: ", focusedItem?.entityProperties.name);

    if (focusedItem === null) return null;

    const unmet = caluclateUnmetItemRequirements(focusedCharacterResult, focusedItem);
    console.log("found unmet: ", unmet);
    return unmet;
  }, [focusedCharacterResult, hoveredEntity, detailedEntity]);

  useEffect(() => {
    console.log("updating unmet: ", unmetRequirements);
    mutateGameStore((state) => {
      state.consideredItemUnmetRequirements = unmetRequirements;
    });
  }, [unmetRequirements]);

  return <div />;
}

function caluclateUnmetItemRequirements(character: Combatant, item: Item) {
  // calculate unmet requirements
  console.log("calculating unmet for ", item.entityProperties.name);
  const totalAttributes = CombatantProperties.getTotalAttributes(character.combatantProperties);

  const unmetAttributeRequirements: CombatAttribute[] = [];
  if (Object.keys(item.requirements).length !== 0) {
    for (const [attributeKey, value] of Object.entries(item.requirements)) {
      const attribute = parseInt(attributeKey) as CombatAttribute;
      const characterAttribute = totalAttributes[attribute] || 0;
      if (characterAttribute >= value) continue;
      else unmetAttributeRequirements.push(attribute);
    }
  }

  if (unmetAttributeRequirements.length > 0) return unmetAttributeRequirements;
  else return null;
}

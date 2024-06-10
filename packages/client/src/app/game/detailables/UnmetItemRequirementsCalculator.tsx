import { useGameStore } from "@/stores/game-store";
import { CombatAttribute, CombatantAttributeRecord } from "@speed-dungeon/common";
import getCombatantTotalAttributes from "@speed-dungeon/common/src/combatants/get-combatant-total-attributes";
import React, { useEffect } from "react";

interface Props {
  attributeRequirements: CombatantAttributeRecord;
  itemId: string;
}

export default function UnmetItemRequirementsCalculator({ attributeRequirements, itemId }: Props) {
  const mutateGameState = useGameStore().mutateState;
  const focusedCharacterResult = useGameStore().getFocusedCharacter();
  if (focusedCharacterResult instanceof Error) return <div>{focusedCharacterResult.message}</div>;
  const focusedCharacter = focusedCharacterResult;

  const totalAttributes = getCombatantTotalAttributes(focusedCharacter.combatantProperties);

  useEffect(() => {
    const unmetAttributeRequirements: CombatAttribute[] = [];
    if (Object.keys(attributeRequirements).length !== 0) {
      for (const [attributeKey, value] of Object.entries(attributeRequirements)) {
        const attribute = attributeKey as unknown as CombatAttribute;
        const characterAttribute = totalAttributes[attribute] || 0;
        if (characterAttribute >= value) continue;
        else unmetAttributeRequirements.push(attribute);
      }
    }

    mutateGameState((gameState) => {
      if (unmetAttributeRequirements.length > 0)
        gameState.consideredItemUnmetRequirements = unmetAttributeRequirements;
      else gameState.consideredItemUnmetRequirements = null;
    });

    return () =>
      mutateGameState((gameState) => {
        gameState.consideredItemUnmetRequirements = null;
      });
  }, [itemId, totalAttributes]);

  return <></>;
}

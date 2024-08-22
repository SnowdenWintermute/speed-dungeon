import { useGameStore } from "@/stores/game-store";
import React, { useEffect } from "react";

export default function TestComponent() {
  const character = useGameStore().getCharacter("1");
  if (character instanceof Error) return <div>no character yet</div>;

  useEffect(() => {
    console.log(character.combatantProperties.combatActionTarget);
  }, [character.combatantProperties.combatActionTarget]);

  return <div>TestComponent</div>;
}

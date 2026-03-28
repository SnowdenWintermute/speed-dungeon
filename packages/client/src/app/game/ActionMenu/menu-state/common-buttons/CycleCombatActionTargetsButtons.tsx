import React from "react";
import { observer } from "mobx-react-lite";
import { ListCyclingButtons } from "./ListCyclingButtons";
import { ClientIntentType, NextOrPrevious } from "@speed-dungeon/common";
import { useClientApplication } from "@/hooks/create-client-application-context";

export const CycleCombatActionTargetsButtons = observer(() => {
  const clientApplication = useClientApplication();
  const { gameClientRef, combatantFocus } = clientApplication;
  const characterId = combatantFocus.requireFocusedCharacterId();

  function onCycle(direction: NextOrPrevious) {
    gameClientRef.get().dispatchIntent({
      type: ClientIntentType.CycleCombatActionTargets,
      data: {
        characterId,
        direction,
      },
    });
  }

  return (
    <ListCyclingButtons
      onCycle={onCycle}
      itemCount={null}
      currentIndex={0}
      directionTitle="Target"
      listTitle={""}
    />
  );
});

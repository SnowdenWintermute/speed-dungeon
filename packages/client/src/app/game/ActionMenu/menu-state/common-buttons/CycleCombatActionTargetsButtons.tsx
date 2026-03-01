import React from "react";
import { observer } from "mobx-react-lite";
import { ListCyclingButtons } from "./ListCyclingButtons";
import { ClientIntentType, NextOrPrevious } from "@speed-dungeon/common";
import { AppStore } from "@/mobx-stores/app-store";
import { gameClientSingleton } from "@/singletons/lobby-client";

export const CycleCombatActionTargetsButtons = observer(() => {
  const { gameStore } = AppStore.get();
  const characterId = gameStore.getExpectedFocusedCharacterId();

  function onCycle(direction: NextOrPrevious) {
    gameClientSingleton.get().dispatchIntent({
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

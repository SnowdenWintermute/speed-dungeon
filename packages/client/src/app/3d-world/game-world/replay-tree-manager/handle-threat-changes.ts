import {
  ActionCompletionUpdateCommand,
  ActivatedTriggersGameUpdateCommand,
  HitOutcomesGameUpdateCommand,
  ThreatChanges,
} from "@speed-dungeon/common";
import { useGameStore } from "@/stores/game-store";
import getGameAndParty from "@/utils/getGameAndParty";
import { plainToInstance } from "class-transformer";
import { threatTargetChangedIndicatorSequence } from "../../scene-entities/character-models/threat-target-changed-indicator-sequence/index";
import debounce from "lodash.debounce";

const debounceThreatTargetChangeIndicatorSequence = debounce(
  threatTargetChangedIndicatorSequence,
  300
);

export function handleThreatChangesUpdate(threatChanges: ThreatChanges | undefined) {
  if (!threatChanges) return;

  useGameStore.getState().mutateState((gameState) => {
    const gameAndPartyResult = getGameAndParty(gameState.game, gameState.username);
    if (gameAndPartyResult instanceof Error) throw gameAndPartyResult;
    const [game, party] = gameAndPartyResult;

    const threatChangesRehydrated = plainToInstance(ThreatChanges, threatChanges);
    threatChangesRehydrated.applyToGame(party);
  });

  // debouncing this is an easy but perhaps not optimal way to avoid showing many
  // threat target change events in a row when threat changes rapidly such as several
  // burning conditions going off in a row
  debounceThreatTargetChangeIndicatorSequence();
}

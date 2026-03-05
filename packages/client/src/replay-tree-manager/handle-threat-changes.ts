import {
  ActionCompletionUpdateCommand,
  ActivatedTriggersGameUpdateCommand,
  HitOutcomesGameUpdateCommand,
  ThreatChanges,
} from "@speed-dungeon/common";
import debounce from "lodash.debounce";
import { AppStore } from "@/mobx-stores/app-store";
import { threatTargetChangedIndicatorSequence } from "@/game-world-view/scene-entities/character-models/threat-target-changed-indicator-sequence";

const debounceThreatTargetChangeIndicatorSequence = debounce(
  threatTargetChangedIndicatorSequence,
  300
);

export function handleThreatChangesUpdate(
  command:
    | HitOutcomesGameUpdateCommand
    | ActionCompletionUpdateCommand
    | ActivatedTriggersGameUpdateCommand
) {
  if (command.threatChanges) {
    const party = AppStore.get().gameStore.getExpectedParty();

    const threatChangesDeserialized = ThreatChanges.fromSerialized(command.threatChanges);
    threatChangesDeserialized.applyToGame(party);

    // @REFACTOR
    // debouncing this is an easy but perhaps not optimal way to avoid showing many
    // threat target change events in a row when threat changes rapidly such as several
    // burning conditions going off in a row
    debounceThreatTargetChangeIndicatorSequence();
  }
}

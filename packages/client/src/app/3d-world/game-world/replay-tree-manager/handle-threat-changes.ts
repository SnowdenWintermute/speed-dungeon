import {
  ActionCompletionUpdateCommand,
  ActivatedTriggersGameUpdateCommand,
  HitOutcomesGameUpdateCommand,
  ThreatChanges,
} from "@speed-dungeon/common";
import { plainToInstance } from "class-transformer";
import { threatTargetChangedIndicatorSequence } from "../../scene-entities/character-models/threat-target-changed-indicator-sequence/index";
import debounce from "lodash.debounce";
import { AppStore } from "@/mobx-stores/app-store";

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

    const threatChangesDeserialized = plainToInstance(ThreatChanges, command.threatChanges);
    threatChangesDeserialized.applyToGame(party);

    // debouncing this is an easy but perhaps not optimal way to avoid showing many
    // threat target change events in a row when threat changes rapidly such as several
    // burning conditions going off in a row
    debounceThreatTargetChangeIndicatorSequence();
  }
}

import {
  ActionCompletionUpdateCommand,
  ActivatedTriggersGameUpdateCommand,
  HitOutcomesGameUpdateCommand,
  ThreatChanges,
} from "@speed-dungeon/common";
import debounce from "lodash.debounce";
import { ClientApplication } from "@/client-application";
import { threatTargetChangedIndicatorSequence } from "@/game-world-view/scene-entities/cosmetic/threat-target-changed-indicator";

const debounceThreatTargetChangeIndicatorSequence = debounce(
  threatTargetChangedIndicatorSequence,
  300
);

export function handleThreatChangesUpdate(
  clientApplication: ClientApplication,
  command:
    | HitOutcomesGameUpdateCommand
    | ActionCompletionUpdateCommand
    | ActivatedTriggersGameUpdateCommand
) {
  if (command.threatChanges) {
    const party = clientApplication.gameContext.requireParty();

    const threatChangesDeserialized = ThreatChanges.fromSerialized(command.threatChanges);
    threatChangesDeserialized.applyToGame(party);

    // @REFACTOR
    // debouncing this is an easy but perhaps not optimal way to avoid showing many
    // threat target change events in a row when threat changes rapidly such as several
    // burning conditions going off in a row
    const gameWorldView = clientApplication.gameWorldView;
    if (!gameWorldView) return;
    debounceThreatTargetChangeIndicatorSequence(clientApplication.gameWorldView, () => {
      return clientApplication.gameContext.partyOption;
    });
  }
}

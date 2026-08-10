import { DEEPEST_FLOOR, invariant } from "@speed-dungeon/common";
import {
  DungeonRunWorkerMessage,
  DungeonRunWorkerMessageType,
  DungeonRunWorkerRequest,
} from "./messages";
import { RunAggregator } from "@/sim/run-aggregator";
import { DungeonRunAnalysis, DungeonRunAnalysisResults } from "../dungeon-run-analysis";
import { AccuracyAvailability } from "../accuracy-availability/index";
import { PartyDrawMode } from "../available-damage/party-draw";
import {
  AvailableDamageBySpecialty,
  DEFAULT_ATTACK_DAMAGE_INTENSITY,
} from "../available-damage/index";
import { DungeonRun } from "@/sim/dungeon-run";

// the dom lib types the ambient `self` as a Window, whose postMessage takes `any` and would check
// nothing here. this is the part of a worker's global scope the file actually uses
declare const self: {
  onmessage: null | ((event: MessageEvent<DungeonRunWorkerRequest>) => void);
  postMessage: (message: DungeonRunWorkerMessage) => void;
};

/** Mapped rather than a plain Record so each analysis is tied to the result type it promises, and
 * adding one without registering an aggregator for it is a compile error. */
type AggregatorFactories = {
  [TAnalysis in DungeonRunAnalysis]: (
    request: DungeonRunWorkerRequest
  ) => RunAggregator<DungeonRunAnalysisResults[TAnalysis]>;
};

const AGGREGATOR_FACTORIES: AggregatorFactories = {
  [DungeonRunAnalysis.AccuracyAvailability]: () => new AccuracyAvailability(),
  [DungeonRunAnalysis.AvailableDamage]: (request) =>
    new AvailableDamageBySpecialty(Math.random, {
      attackDamageIntensity: DEFAULT_ATTACK_DAMAGE_INTENSITY,
      draw: request.draw ?? { type: PartyDrawMode.EvenlyDistributed },
    }),
};

function post(message: DungeonRunWorkerMessage) {
  self.postMessage(message);
}

self.onmessage = ({ data }) => {
  const makeAggregator = AGGREGATOR_FACTORIES[data.analysis];
  invariant(makeAggregator !== undefined, `no aggregator registered for analysis ${data.analysis}`);
  const aggregator = makeAggregator(data);

  try {
    for (let runsCompleted = 0; runsCompleted < data.runCount; runsCompleted += 1) {
      // the walk is discarded as soon as it is collected, so only the aggregator's samples grow
      aggregator.collectRun(
        DungeonRun.random(aggregator.nextParty(), DEEPEST_FLOOR).walk()
      );
      post({ type: DungeonRunWorkerMessageType.Progress, runsCompleted: runsCompleted + 1 });
    }

    post({ type: DungeonRunWorkerMessageType.Complete, result: aggregator.assemble() });
  } catch (error) {
    post({
      type: DungeonRunWorkerMessageType.Failed,
      reason: error instanceof Error ? error.message : String(error),
    });
  }
};

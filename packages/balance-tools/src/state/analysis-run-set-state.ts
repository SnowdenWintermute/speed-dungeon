import { makeAutoObservable, observable, runInAction } from "mobx";
import { AnalysisCharacterSpecification } from "../analysis-subjects/analysis-character-specification.ts";
import {
  AnalysisRunSetOptions,
  AnalysisRunSetWorkerMessage,
  AnalysisRunSetWorkerMessageType,
  AnalysisRunSetWorkerRequest,
} from "../analysis-runs/run-set-worker-messages.ts";
import { SavedRun, savedRunFetchUrl, savedRunWritePath } from "../analysis-runs/saved-run-paths.ts";
import {
  DungeonRunAnalysis,
  DungeonRunAnalysisResults,
} from "../analysis-runs/dungeon-run-analysis.ts";
import { StudyName } from "../studies/study-name.ts";
import { writeGeneratedFile } from "../write-generated-file.ts";

export class AnalysisRunSetState<AnalysisType extends DungeonRunAnalysis> {
  result: null | DungeonRunAnalysisResults[AnalysisType] = null;
  runCountShown: null | number = null;
  /** what the shown result was walked at; null for a saved run from before these were recorded */
  optionsShown: null | AnalysisRunSetOptions = null;
  runsFinished = 0;
  runsRequested = 0;
  runsFailed = 0;
  isRunning = false;
  /** a saved run is 100MB of json, so the wait is long enough to need saying */
  isLoadingSavedRun = false;
  failureReason: null | string = null;
  /** so a run loaded from disk is never mistaken for one just walked */
  resultIsFromSavedRun = false;
  private worker: null | Worker = null;
  /** a saved run read that a later retarget outran must not land on the study now selected */
  private savedRunReadId = 0;

  constructor(
    private readonly studyName: StudyName,
    private readonly analysis: AnalysisType
  ) {
    makeAutoObservable<this, "worker" | "savedRunReadId" | "studyName" | "analysis">(this, {
      // a result is a sample graph large enough that deep proxying it would cost more than walking
      // the run did
      result: observable.ref,
      worker: false,
      savedRunReadId: false,
      studyName: false,
      analysis: false,
    });
  }

  clear() {
    this.worker?.terminate();
    this.worker = null;
    this.savedRunReadId++;
    this.result = null;
    this.runCountShown = null;
    this.optionsShown = null;
    this.runsFinished = 0;
    this.runsRequested = 0;
    this.runsFailed = 0;
    this.isRunning = false;
    this.isLoadingSavedRun = false;
    this.failureReason = null;
    this.resultIsFromSavedRun = false;
  }

  // a study's last saved run stands in until one is walked, so a reload does not cost a set.
  // no saved run is the ordinary first-use case, so a miss is silent
  async loadSavedRun() {
    this.savedRunReadId++;
    const readId = this.savedRunReadId;
    this.isLoadingSavedRun = true;

    try {
      const response = await fetch(savedRunFetchUrl(this.studyName));
      const saved: null | SavedRun<AnalysisType> = response.ok ? await response.json() : null;
      runInAction(() => {
        if (readId !== this.savedRunReadId) {
          return;
        }
        this.isLoadingSavedRun = false;
        if (saved === null || this.result !== null || this.isRunning) {
          return;
        }
        this.result = saved.result;
        this.runCountShown = saved.runCount;
        this.optionsShown = saved.options ?? null;
        this.runsFailed = saved.result.runsFailed;
        this.resultIsFromSavedRun = true;
      });
    } catch {
      runInAction(() => {
        if (readId === this.savedRunReadId) {
          this.isLoadingSavedRun = false;
        }
      });
    }
  }

  run(characterSpecs: AnalysisCharacterSpecification[], options: AnalysisRunSetOptions) {
    const { runCount } = options;
    this.worker?.terminate();

    const worker = new Worker(new URL("../analysis-runs/run-set-worker.ts", import.meta.url), {
      type: "module",
    });
    this.worker = worker;

    this.runsFinished = 0;
    this.runsRequested = runCount;
    this.runsFailed = 0;
    this.isRunning = true;
    this.failureReason = null;

    worker.onmessage = ({ data }: MessageEvent<AnalysisRunSetWorkerMessage<AnalysisType>>) => {
      runInAction(() => {
        switch (data.type) {
          case AnalysisRunSetWorkerMessageType.Progress:
            this.runsFinished = data.runsFinished;
            break;
          case AnalysisRunSetWorkerMessageType.Complete:
            this.result = data.result;
            this.runCountShown = this.runsRequested;
            this.optionsShown = options;
            this.runsFailed = data.result.runsFailed;
            this.isRunning = false;
            this.resultIsFromSavedRun = false;
            worker.terminate();
            break;
          case AnalysisRunSetWorkerMessageType.Failed:
            this.isRunning = false;
            this.failureReason = data.reason;
            worker.terminate();
            break;
        }
      });
    };

    worker.onerror = (event) => {
      runInAction(() => {
        this.isRunning = false;
        this.failureReason = event.message;
      });
      worker.terminate();
    };

    // Worker.postMessage takes `any`, so the request is annotated to be checked against the shape
    // the worker reads
    const request: AnalysisRunSetWorkerRequest = {
      ...options,
      analysis: this.analysis,
      characterSpecs: characterSpecs.map((spec) => spec.toSerialized()),
    };
    worker.postMessage(request);
  }

  // nothing saves on its own: a comparison run must never overwrite the run a generated file came from
  async save() {
    const { result, runCountShown, optionsShown } = this;
    if (result === null || runCountShown === null) {
      throw new Error("there is no run to save");
    }
    const saved: SavedRun<AnalysisType> = {
      runCount: runCountShown,
      result,
      ...(optionsShown === null ? {} : { options: optionsShown }),
    };
    return writeGeneratedFile(savedRunWritePath(this.studyName), JSON.stringify(saved));
  }
}

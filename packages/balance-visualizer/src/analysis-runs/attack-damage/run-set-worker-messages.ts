import { SerializedOf } from "@speed-dungeon/common";
import { AttackDamageRunSetResult } from "./samples";
import { AnalysisCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";

/** the specs cross as data: postMessage would hand the worker the fields without the class */
export interface AttackDamageRunSetWorkerRequest {
  characterSpecs: SerializedOf<AnalysisCharacterSpecification>[];
  runCount: number;
}

export enum AttackDamageRunSetWorkerMessageType {
  Progress,
  Complete,
  Failed,
}

export type AttackDamageRunSetWorkerMessage =
  | { type: AttackDamageRunSetWorkerMessageType.Progress; runsFinished: number }
  | { type: AttackDamageRunSetWorkerMessageType.Complete; result: AttackDamageRunSetResult }
  | { type: AttackDamageRunSetWorkerMessageType.Failed; reason: string };

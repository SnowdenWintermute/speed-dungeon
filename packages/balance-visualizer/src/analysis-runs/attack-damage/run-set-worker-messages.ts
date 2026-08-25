import { SerializedCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";
import { AttackDamageRunSetResult } from "./samples";

/** the specs cross as data: postMessage would hand the worker the fields without the class */
export interface AttackDamageRunSetWorkerRequest {
  characterSpecs: SerializedCharacterSpecification[];
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

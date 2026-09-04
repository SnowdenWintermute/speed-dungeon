import { makeAutoObservable, observable, runInAction } from "mobx";
import { AnalysisCharacterSpecification } from "../analysis-subjects/analysis-character-specification.ts";
import { CopiedAttributeProfileReader } from "../analysis-runs/copied-attribute-profile-reader.ts";

export enum CopiedAttributeProfilesType {
  Reading,
  Ready,
  Blocked,
}

export type CopiedAttributeProfiles =
  | { type: CopiedAttributeProfilesType.Reading }
  | { type: CopiedAttributeProfilesType.Ready; characterSpecs: AnalysisCharacterSpecification[] }
  | { type: CopiedAttributeProfilesType.Blocked; reason: string };

export class CopiedAttributeProfilesState {
  profiles: CopiedAttributeProfiles = { type: CopiedAttributeProfilesType.Reading };
  /** a read that a later one outran must not land after it */
  private readId = 0;

  constructor(private readonly characterSpecs: AnalysisCharacterSpecification[]) {
    makeAutoObservable<this, "readId" | "characterSpecs">(this, {
      // the specs on a ready profile are class instances the run set hands straight to a worker
      profiles: observable.ref,
      readId: false,
      characterSpecs: false,
    });
  }

  get blockedReason() {
    switch (this.profiles.type) {
      case CopiedAttributeProfilesType.Ready:
        return null;
      case CopiedAttributeProfilesType.Reading:
        return "reading copied attributes...";
      case CopiedAttributeProfilesType.Blocked:
        return this.profiles.reason;
    }
  }

  get readyCharacterSpecs() {
    return this.profiles.type === CopiedAttributeProfilesType.Ready
      ? this.profiles.characterSpecs
      : null;
  }

  async read() {
    this.readId++;
    const readId = this.readId;
    this.profiles = { type: CopiedAttributeProfilesType.Reading };

    try {
      const filled = await new CopiedAttributeProfileReader(this.characterSpecs).readFilledSpecs();
      runInAction(() => {
        if (readId === this.readId) {
          this.profiles = { type: CopiedAttributeProfilesType.Ready, characterSpecs: filled };
        }
      });
    } catch (probablyError) {
      runInAction(() => {
        if (readId === this.readId) {
          this.profiles = {
            type: CopiedAttributeProfilesType.Blocked,
            reason: probablyError instanceof Error ? probablyError.message : String(probablyError),
          };
        }
      });
    }
  }
}

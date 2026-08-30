import { useEffect, useState } from "react";
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

export function describeCopiedAttributeProfilesBlock(profiles: CopiedAttributeProfiles) {
  switch (profiles.type) {
    case CopiedAttributeProfilesType.Ready:
      return null;
    case CopiedAttributeProfilesType.Reading:
      return "reading copied attributes...";
    case CopiedAttributeProfilesType.Blocked:
      return profiles.reason;
  }
}

export function useCopiedAttributeProfiles(
  characterSpecs: AnalysisCharacterSpecification[]
): CopiedAttributeProfiles {
  const [profiles, setProfiles] = useState<CopiedAttributeProfiles>({
    type: CopiedAttributeProfilesType.Reading,
  });

  useEffect(() => {
    let isCurrent = true;
    setProfiles({ type: CopiedAttributeProfilesType.Reading });

    new CopiedAttributeProfileReader(characterSpecs)
      .readFilledSpecs()
      .then((filled) => {
        if (isCurrent) {
          setProfiles({ type: CopiedAttributeProfilesType.Ready, characterSpecs: filled });
        }
      })
      .catch((probablyError) => {
        if (isCurrent) {
          setProfiles({
            type: CopiedAttributeProfilesType.Blocked,
            reason: probablyError instanceof Error ? probablyError.message : String(probablyError),
          });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [characterSpecs]);

  return profiles;
}

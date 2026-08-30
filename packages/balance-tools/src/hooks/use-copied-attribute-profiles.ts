import { useEffect, useState } from "react";
import { AnalysisCharacterSpecification } from "../analysis-subjects/analysis-character-specification.ts";
import { AttributeSourceType } from "../analysis-subjects/attribute-source.ts";
import { AnalysisSampleDimensions } from "../analysis-runs/analysis-sample.ts";
import { selectCopiedAttributeProfile } from "../analysis-runs/copied-attribute-profile-selection.ts";
import { AnalysisSampleRunSetResult } from "../analysis-runs/run-set.ts";
import { savedRunFetchUrl } from "../analysis-runs/saved-run-paths.ts";
import { STUDY_NAME_SLUGS, StudyName } from "../studies/study-name.ts";

interface SavedRunSamples {
  result: AnalysisSampleRunSetResult<AnalysisSampleDimensions>;
}

/**
 * A study whose characters copy their attributes cannot run until the studies they copy from have
 * been walked and saved. Reading those saved runs here rather than generating a module keeps the
 * copy current with whatever the source studies last recorded.
 */
export function useCopiedAttributeProfiles(characterSpecs: AnalysisCharacterSpecification[]) {
  const [resolved, setResolved] = useState<null | AnalysisCharacterSpecification[]>(null);
  const [blockedReason, setBlockedReason] = useState<null | string>(null);

  useEffect(() => {
    const copiedStudyNames = new Set(
      characterSpecs.flatMap((spec) =>
        spec.attributeSource.type === AttributeSourceType.CopiedFromStudyTable
          ? [spec.attributeSource.studyName]
          : []
      )
    );

    if (copiedStudyNames.size === 0) {
      setResolved(characterSpecs);
      setBlockedReason(null);
      return;
    }

    let isCurrent = true;
    setResolved(null);
    setBlockedReason(null);

    fetchSamplesByStudy([...copiedStudyNames])
      .then((samplesByStudy) => {
        if (!isCurrent) {
          return;
        }
        setResolved(fillProfiles(characterSpecs, samplesByStudy));
      })
      .catch((probablyError) => {
        if (isCurrent) {
          setBlockedReason(
            probablyError instanceof Error ? probablyError.message : String(probablyError)
          );
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [characterSpecs]);

  return { characterSpecs: resolved, blockedReason };
}

async function fetchSamplesByStudy(studyNames: StudyName[]) {
  const samplesByStudy = new Map<StudyName, AnalysisSampleDimensions[]>();

  for (const studyName of studyNames) {
    const response = await fetch(savedRunFetchUrl(studyName));
    if (!response.ok) {
      throw new Error(
        `no saved run for ${STUDY_NAME_SLUGS[studyName]} to copy attributes from — run that ` +
          `study and save it first`
      );
    }
    const saved: SavedRunSamples = await response.json();
    samplesByStudy.set(studyName, saved.result.samples);
  }

  return samplesByStudy;
}

function fillProfiles(
  characterSpecs: AnalysisCharacterSpecification[],
  samplesByStudy: Map<StudyName, AnalysisSampleDimensions[]>
) {
  return characterSpecs.map((spec) => {
    const { attributeSource } = spec;
    if (attributeSource.type !== AttributeSourceType.CopiedFromStudyTable) {
      return spec;
    }

    const samples = samplesByStudy.get(attributeSource.studyName) ?? [];
    const rooms = selectCopiedAttributeProfile(samples, attributeSource.slice);
    if (rooms.length === 0) {
      throw new Error(
        `the saved run for ${STUDY_NAME_SLUGS[attributeSource.studyName]} has no samples for ` +
          `${spec.name}'s build, so it has no attributes to copy`
      );
    }

    return spec.withCopiedProfileRooms(rooms);
  });
}

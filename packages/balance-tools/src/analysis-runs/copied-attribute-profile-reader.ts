import { AnalysisCharacterSpecification } from "../analysis-subjects/analysis-character-specification.ts";
import { AttributeSourceType } from "../analysis-subjects/attribute-source.ts";
import { CopiedAttributeProfile } from "../analysis-subjects/copied-attribute-profile.ts";
import { STUDY_NAME_SLUGS, StudyName } from "../studies/study-name.ts";
import { AnalysisSampleDimensions } from "./analysis-sample.ts";
import { DungeonRunAnalysis } from "./dungeon-run-analysis.ts";
import { SavedRun, savedRunFetchUrl } from "./saved-run-paths.ts";

/**
 * A study whose characters copy their attributes cannot run until the studies they copy from have
 * been walked and saved. Reading those saved runs on demand rather than generating a module keeps
 * the copy current with whatever the source studies last recorded.
 */
export class CopiedAttributeProfileReader {
  constructor(private characterSpecs: AnalysisCharacterSpecification[]) {}

  private selectCopiedStudyNames() {
    return [
      ...new Set(
        this.characterSpecs.flatMap((spec) =>
          spec.attributeSource.type === AttributeSourceType.CopiedFromStudyTable
            ? [spec.attributeSource.studyName]
            : []
        )
      ),
    ];
  }

  private static async fetchSamplesByStudy(studyNames: StudyName[]) {
    const samplesByStudy = new Map<StudyName, AnalysisSampleDimensions[]>();

    for (const studyName of studyNames) {
      const response = await fetch(savedRunFetchUrl(studyName));
      if (!response.ok) {
        throw new Error(
          `no saved run for ${STUDY_NAME_SLUGS[studyName]} to copy attributes from — run that ` +
            `study and save it first`
        );
      }
      const saved: SavedRun<DungeonRunAnalysis> = await response.json();
      samplesByStudy.set(studyName, saved.result.samples);
    }

    return samplesByStudy;
  }

  private fillProfiles(samplesByStudy: Map<StudyName, AnalysisSampleDimensions[]>) {
    return this.characterSpecs.map((spec) => {
      const { attributeSource } = spec;
      if (attributeSource.type !== AttributeSourceType.CopiedFromStudyTable) {
        return spec;
      }

      const samples = samplesByStudy.get(attributeSource.studyName) ?? [];
      const rooms = CopiedAttributeProfile.selectRooms(samples, attributeSource.slice);
      if (rooms.length === 0) {
        throw new Error(
          `the saved run for ${STUDY_NAME_SLUGS[attributeSource.studyName]} has no samples for ` +
            `${spec.name}'s build, so it has no attributes to copy`
        );
      }

      return spec.withCopiedProfileRooms(rooms);
    });
  }

  async readFilledSpecs() {
    const copiedStudyNames = this.selectCopiedStudyNames();
    if (copiedStudyNames.length === 0) {
      return this.characterSpecs;
    }

    return this.fillProfiles(
      await CopiedAttributeProfileReader.fetchSamplesByStudy(copiedStudyNames)
    );
  }
}

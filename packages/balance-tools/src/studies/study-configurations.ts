import { AnalysisCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";
import { DEFAULT_ANALYSIS_CHARACTER_SPECS } from "@/analysis-subjects/default-analysis-character-specs";
import { StudyName } from "./study-name";

export interface StudyConfiguration {
  characterSpecs: AnalysisCharacterSpecification[];
}

/** a Record so a study without a configuration is a compile error rather than a lookup miss */
export const STUDY_CONFIGURATIONS: Record<StudyName, StudyConfiguration> = {
  [StudyName.MaxAccuracyMixed]: { characterSpecs: DEFAULT_ANALYSIS_CHARACTER_SPECS },
  [StudyName.AttackDamageMixed]: { characterSpecs: DEFAULT_ANALYSIS_CHARACTER_SPECS },
};

import { AdventuringParty } from "@speed-dungeon/common";
import { AnalysisSubjects } from "../analysis-runs/analysis-subjects.ts";
import { AttributeSourceType } from "../analysis-subjects/attribute-source.ts";
import { CopiedAttributeProfile } from "../analysis-subjects/copied-attribute-profile.ts";
import { ANALYSIS_GOAL_STRINGS } from "../goal-performance-checkers/analysis-goal.ts";
import { STUDY_NAME_SLUGS } from "../studies/study-name.ts";
import { AnalysisAttributeSolver } from "./analysis-attribute-solver.ts";

export class CopiedAttributeSolver implements AnalysisAttributeSolver {
  private profiles: CopiedAttributeProfile[] = [];

  constructor(
    private party: AdventuringParty,
    analysisSubjects: AnalysisSubjects
  ) {
    for (const combatant of party.combatantManager.getPartyMemberCharacters()) {
      const spec = analysisSubjects.requireSpec(combatant.getEntityId());
      const { attributeSource } = spec;
      if (attributeSource.type !== AttributeSourceType.CopiedFromStudyTable) {
        continue;
      }

      this.profiles.push(
        new CopiedAttributeProfile(
          combatant,
          `${spec.name} chasing ${ANALYSIS_GOAL_STRINGS[spec.goal]}, copying ` +
            `${STUDY_NAME_SLUGS[attributeSource.studyName]}`,
          attributeSource.rooms
        )
      );
    }
  }

  solve() {
    const { dungeonExplorationManager } = this.party;
    const location = {
      floor: dungeonExplorationManager.getCurrentFloor(),
      room: dungeonExplorationManager.getCurrentRoomNumber(),
    };

    for (const profile of this.profiles) {
      profile.applyForRoom(location);
    }
  }
}

import { StudyPanel } from "../../components/study-panel.tsx";
import { StudyName } from "../study-name.ts";
import { MAX_SPEED_TABLE_COLUMNS } from "./columns.tsx";
import { MaxSpeedTable } from "./table.ts";
import { SpeedCurveSection } from "./speed-curve/section.tsx";

type MaxSpeedStudyName = StudyName.MaxSpeedMixed | StudyName.MaxAgilityGroupThree;

export function MaxSpeedPanel(studyName: MaxSpeedStudyName) {
  return (
    <StudyPanel
      studyName={studyName}
      aboveTable={studyName === StudyName.MaxAgilityGroupThree && <SpeedCurveSection />}
      columns={MAX_SPEED_TABLE_COLUMNS}
      tableConstructor={MaxSpeedTable}
    />
  );
}

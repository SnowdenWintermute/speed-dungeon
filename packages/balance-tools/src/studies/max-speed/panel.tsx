import { StudyPanel } from "../../components/study-panel.tsx";
import { FULL_ALLOCATION_INTENSITY } from "../../analysis-runs/allocation-intensity.ts";
import { DESIGNED_AGILITY_INVESTMENT_PERCENTAGE } from "../../tuning-consts.ts";
import { StudyName } from "../study-name.ts";
import { MAX_SPEED_TABLE_COLUMNS } from "./columns.tsx";
import { MaxSpeedTable } from "./table.ts";

export function MaxSpeedPanel() {
  return (
    <StudyPanel
      studyName={StudyName.MaxSpeedMixed}
      columns={MAX_SPEED_TABLE_COLUMNS}
      tableConstructor={MaxSpeedTable}
      // the ceiling first: what the designed share is worth is read by dialing the intensity down
      // from it, so this study is the one that must not pin the slider
      defaultAllocationIntensity={FULL_ALLOCATION_INTENSITY}
      designedAllocationIntensity={DESIGNED_AGILITY_INVESTMENT_PERCENTAGE}
      // a speed read never touches a dummy, so arming one would only mislead
      fixedTargetDummiesHaveArmorClass={false}
    />
  );
}

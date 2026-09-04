import { observer } from "mobx-react-lite";
import {
  COMBATANT_CLASS_NAME_STRINGS,
  CombatantClass,
  iterateNumericEnum,
} from "@speed-dungeon/common";
import { SelectDropdown } from "@speed-dungeon/ui/atoms/SelectDropdown";
import { DungeonRunAnalysis } from "../analysis-runs/dungeon-run-analysis.ts";
import { ANALYSIS_GOAL_STRINGS } from "../goal-performance-checkers/analysis-goal.ts";
import { StudyPanelState } from "../state/study-panel-state.ts";
import {
  CHARACTER_WEAPON_SPECIALTY_STRINGS,
  CharacterWeaponSpecialty,
} from "../analysis-subjects/character-weapon-specialty.ts";

const ANY_OPTION_VALUE = "any";
const ANY_OPTION = { title: "Any", value: ANY_OPTION_VALUE };

const COMBATANT_CLASS_OPTIONS = iterateNumericEnum(CombatantClass).map((combatantClass) => ({
  title: COMBATANT_CLASS_NAME_STRINGS[combatantClass],
  value: combatantClass,
}));

const WEAPON_SPECIALTY_OPTIONS = iterateNumericEnum(CharacterWeaponSpecialty).map((specialty) => ({
  title: CHARACTER_WEAPON_SPECIALTY_STRINGS[specialty],
  value: specialty,
}));

/** owns the "Any" sentinel so each dimension's own handler only ever sees its own value type */
function SliceDropdown<T>({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: T | undefined;
  options: { title: string; value: T }[];
  onChange: (value: T | undefined) => void;
}) {
  return (
    <label className="flex flex-col w-52">
      <span className="text-theme-muted">{title}</span>
      <SelectDropdown
        title={title}
        value={value === undefined ? ANY_OPTION_VALUE : value}
        setValue={(selected) => onChange(selected === ANY_OPTION_VALUE ? undefined : selected)}
        options={[ANY_OPTION, ...options]}
        disabled={false}
      />
    </label>
  );
}

export const AnalysisSliceControls = observer(
  ({ panel }: { panel: StudyPanelState<DungeonRunAnalysis> }) => {
    const { slice, goalsInParty } = panel;

    return (
      <div className="mb-4 flex items-end gap-2">
        {goalsInParty.length > 1 && (
          <SliceDropdown
            title="Goal"
            value={slice.goal}
            options={goalsInParty.map((goal) => ({
              title: ANALYSIS_GOAL_STRINGS[goal],
              value: goal,
            }))}
            onChange={(goal) => panel.setSlice({ ...slice, goal })}
          />
        )}
        <SliceDropdown
          title="Specialty"
          value={slice.weaponSpecialty}
          options={WEAPON_SPECIALTY_OPTIONS}
          onChange={(weaponSpecialty) => panel.setSlice({ ...slice, weaponSpecialty })}
        />
        <SliceDropdown
          title="Main class"
          value={slice.mainClass}
          options={COMBATANT_CLASS_OPTIONS}
          onChange={(mainClass) => panel.setSlice({ ...slice, mainClass })}
        />
        <SliceDropdown<CombatantClass | null>
          title="Support class"
          value={slice.supportClass}
          options={[{ title: "None", value: null }, ...COMBATANT_CLASS_OPTIONS]}
          onChange={(supportClass) => panel.setSlice({ ...slice, supportClass })}
        />
      </div>
    );
  }
);

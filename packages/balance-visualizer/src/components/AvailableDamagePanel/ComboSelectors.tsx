import { COMBATANT_CLASS_NAME_STRINGS, CombatantClass } from "@speed-dungeon/common";
import { SelectDropdown } from "@speed-dungeon/ui/atoms/SelectDropdown";
import { CHARACTER_ARCHETYPE_NAMES, CharacterArchetype } from "@/analysis/character-archetype";
import { SPECIALTY_COMBOS, SpecialtyCombo } from "@/analysis/available-damage/specialty-combo";

const NO_SUPPORT_CLASS = "none";

/** Only combos that exist are offered, and changing one field repairs the others rather than
 * leaving the three selects describing a character the study never walks — a Bow specialty is
 * always a Rogue, so picking it has to move the class select too. */
function repair(combo: SpecialtyCombo, changed: Partial<SpecialtyCombo>): SpecialtyCombo {
  const wanted = { ...combo, ...changed };
  const exact = SPECIALTY_COMBOS.find(
    (candidate) =>
      candidate.archetype === wanted.archetype &&
      candidate.mainClass === wanted.mainClass &&
      candidate.supportClass === wanted.supportClass
  );
  if (exact !== undefined) {
    return exact;
  }

  const keepingClass = SPECIALTY_COMBOS.find(
    (candidate) =>
      candidate.archetype === wanted.archetype && candidate.mainClass === wanted.mainClass
  );
  const keepingArchetype = SPECIALTY_COMBOS.find(
    (candidate) => candidate.archetype === wanted.archetype
  );

  return keepingClass ?? keepingArchetype ?? wanted;
}

function distinct<TValue>(values: TValue[]) {
  return [...new Set(values)];
}

export function ComboSelectors({
  combo,
  onChange,
  disabled,
}: {
  combo: SpecialtyCombo;
  onChange: (combo: SpecialtyCombo) => void;
  disabled: boolean;
}) {
  const archetypes = distinct(SPECIALTY_COMBOS.map(({ archetype }) => archetype));
  const mainClasses = distinct(
    SPECIALTY_COMBOS.filter(({ archetype }) => archetype === combo.archetype).map(
      ({ mainClass }) => mainClass
    )
  );
  const supportClasses = distinct(
    SPECIALTY_COMBOS.filter(
      ({ archetype, mainClass }) =>
        archetype === combo.archetype && mainClass === combo.mainClass
    ).map(({ supportClass }) => supportClass)
  );

  return (
    <div className="flex items-end gap-4">
      <SelectDropdown
        title="specialty"
        value={combo.archetype}
        setValue={(archetype: CharacterArchetype) => onChange(repair(combo, { archetype }))}
        options={archetypes.map((archetype) => ({
          title: CHARACTER_ARCHETYPE_NAMES[archetype],
          value: archetype,
        }))}
        disabled={disabled}
      />
      <SelectDropdown
        title="main class"
        value={combo.mainClass}
        setValue={(mainClass: CombatantClass) => onChange(repair(combo, { mainClass }))}
        options={mainClasses.map((mainClass) => ({
          title: COMBATANT_CLASS_NAME_STRINGS[mainClass],
          value: mainClass,
        }))}
        disabled={disabled}
      />
      <SelectDropdown
        title="support class"
        value={combo.supportClass ?? NO_SUPPORT_CLASS}
        setValue={(value: CombatantClass | typeof NO_SUPPORT_CLASS) =>
          onChange(repair(combo, { supportClass: value === NO_SUPPORT_CLASS ? null : value }))
        }
        options={supportClasses.map((supportClass) => ({
          title:
            supportClass === null ? "none" : COMBATANT_CLASS_NAME_STRINGS[supportClass],
          value: supportClass ?? NO_SUPPORT_CLASS,
        }))}
        disabled={disabled}
      />
    </div>
  );
}

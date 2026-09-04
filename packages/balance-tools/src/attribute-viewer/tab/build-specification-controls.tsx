import {
  COMBAT_ATTRIBUTE_STRINGS,
  COMBAT_ATTRIBUTES,
  COMBATANT_CLASS_NAME_STRINGS,
  CombatantClass,
  iterateNumericEnum,
} from "@speed-dungeon/common";
import { RadioGroup } from "@speed-dungeon/ui/atoms/RadioGroup";
import { SelectDropdown } from "@speed-dungeon/ui/atoms/SelectDropdown";
import { CharacterBuildSpecification } from "../../analysis-subjects/analysis-character-specification";
import {
  CHARACTER_WEAPON_SPECIALTY_STRINGS,
  CharacterWeaponSpecialty,
} from "../../analysis-subjects/character-weapon-specialty";
import { AttainableAttributeSpecification } from "../attainable-attribute-calculator";

const ATTRIBUTE_OPTIONS = COMBAT_ATTRIBUTES.map((attribute) => ({
  title: COMBAT_ATTRIBUTE_STRINGS[attribute],
  value: attribute,
}));

const CLASS_OPTIONS = iterateNumericEnum(CombatantClass).map((combatantClass) => ({
  title: COMBATANT_CLASS_NAME_STRINGS[combatantClass],
  value: combatantClass,
}));

const NO_SUPPORT_CLASS_OPTION = { title: "None", value: null };

const WEAPON_SPECIALTY_OPTIONS = iterateNumericEnum(CharacterWeaponSpecialty).map((specialty) => ({
  title: CHARACTER_WEAPON_SPECIALTY_STRINGS[specialty],
  value: specialty,
}));

interface Props {
  specification: AttainableAttributeSpecification;
  setSpecification: (specification: AttainableAttributeSpecification) => void;
  disabled: boolean;
}

export function BuildSpecificationControls({ specification, setSpecification, disabled }: Props) {
  const { attribute, buildSpec } = specification;

  function setBuildSpec(updated: CharacterBuildSpecification) {
    setSpecification({ ...specification, buildSpec: updated });
  }

  // a character supports itself with any class but the one it already mains, so taking a new main
  // class has to give up a support selection that just became the same class
  function setMainClass(mainClass: CombatantClass) {
    setBuildSpec({
      ...buildSpec,
      mainClass,
      supportClass: buildSpec.supportClass === mainClass ? null : buildSpec.supportClass,
    });
  }

  const supportClassOptions = [
    NO_SUPPORT_CLASS_OPTION,
    ...CLASS_OPTIONS.map((option) => ({
      ...option,
      disabled: option.value === buildSpec.mainClass,
    })),
  ];

  return (
    <div className="mb-4 flex flex-wrap items-end gap-6">
      <div className="flex flex-col text-sm text-theme-muted">
        <span className="mb-1">attribute</span>
        <SelectDropdown
          title="attribute"
          extraStyles="w-48"
          value={attribute}
          setValue={(selected) => setSpecification({ ...specification, attribute: selected })}
          options={ATTRIBUTE_OPTIONS}
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col text-sm text-theme-muted border border-theme-muted py-2 px-4">
        <span className="mb-1">main class</span>
        <RadioGroup
          title="main class"
          extraStyles="h-10"
          value={buildSpec.mainClass}
          setValue={setMainClass}
          options={CLASS_OPTIONS}
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col text-sm text-theme-muted border border-theme-muted py-2 px-4">
        <span className="mb-1">support class</span>
        <RadioGroup
          title="support class"
          extraStyles="h-10"
          value={buildSpec.supportClass}
          setValue={(supportClass) => setBuildSpec({ ...buildSpec, supportClass })}
          options={supportClassOptions}
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col text-sm text-theme-muted border border-theme-muted py-2 px-4">
        <span className="mb-1">weapon specialty</span>
        <RadioGroup
          title="weapon specialty"
          extraStyles="h-10"
          value={buildSpec.weaponSpecialty}
          setValue={(weaponSpecialty) => setBuildSpec({ ...buildSpec, weaponSpecialty })}
          options={WEAPON_SPECIALTY_OPTIONS}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

import { observer } from "mobx-react-lite";
import {
  COMBAT_ATTRIBUTE_STRINGS,
  COMBAT_ATTRIBUTES,
  COMBATANT_CLASS_NAME_STRINGS,
  CombatantClass,
  iterateNumericEnum,
} from "@speed-dungeon/common";
import { RadioGroup } from "@speed-dungeon/ui/atoms/RadioGroup";
import { SelectDropdown } from "@speed-dungeon/ui/atoms/SelectDropdown";
import {
  CHARACTER_WEAPON_SPECIALTY_STRINGS,
  CharacterWeaponSpecialty,
} from "../../analysis-subjects/character-weapon-specialty";
import { useBalanceToolsApplication } from "../../state/context";

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

export const BuildSpecificationControls = observer(() => {
  const { attainableAttributes } = useBalanceToolsApplication();
  const { attribute, buildSpec } = attainableAttributes.specification;
  const disabled = attainableAttributes.isCalculating;

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
          setValue={(selected) => attainableAttributes.setAttribute(selected)}
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
          setValue={(mainClass) => attainableAttributes.setMainClass(mainClass)}
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
          setValue={(supportClass) =>
            attainableAttributes.setBuildSpec({ ...buildSpec, supportClass })
          }
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
          setValue={(weaponSpecialty) =>
            attainableAttributes.setBuildSpec({ ...buildSpec, weaponSpecialty })
          }
          options={WEAPON_SPECIALTY_OPTIONS}
          disabled={disabled}
        />
      </div>
    </div>
  );
});

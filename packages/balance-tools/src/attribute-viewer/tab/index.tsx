import { useState } from "react";
import {
  COMBAT_ATTRIBUTE_STRINGS,
  COMBATANT_CLASS_NAME_STRINGS,
  COMBATANT_MAX_LEVEL,
  CombatantClass,
  CombatAttribute,
} from "@speed-dungeon/common";
import ButtonBasic from "@speed-dungeon/ui/atoms/ButtonBasic";
import { DataTable } from "@speed-dungeon/ui/atoms/DataTable";
import { DataTableLayout } from "@speed-dungeon/ui/atoms/DataTable/column";
import LoadingSpinner from "@speed-dungeon/ui/atoms/LoadingSpinner";
import { CharacterBuildSpecification } from "../../analysis-subjects/analysis-character-specification";
import {
  CHARACTER_WEAPON_SPECIALTY_STRINGS,
  CharacterWeaponSpecialty,
} from "../../analysis-subjects/character-weapon-specialty";
import {
  AttainableAttributeCalculator,
  AttainableAttributeSpecification,
  ScoredEquipmentSets,
} from "../attainable-attribute-calculator";
import { BuildSpecificationControls } from "./build-specification-controls";
import { SCORED_EQUIPMENT_SET_COLUMNS } from "./scored-equipment-set-columns";

const DEFAULT_SPECIFICATION: AttainableAttributeSpecification = {
  attribute: CombatAttribute.Speed,
  buildSpec: {
    mainClass: CombatantClass.Rogue,
    supportClass: CombatantClass.Warrior,
    weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee,
  },
  level: COMBATANT_MAX_LEVEL,
};

// what the shown numbers came from, which is the specification as it was when calculate was
// pressed rather than whatever is dialed in now
interface Calculation {
  specification: AttainableAttributeSpecification;
  scoredSets: ScoredEquipmentSets;
}

function describeBuild(buildSpec: CharacterBuildSpecification) {
  const { mainClass, supportClass, weaponSpecialty } = buildSpec;
  const classes =
    supportClass === null
      ? COMBATANT_CLASS_NAME_STRINGS[mainClass]
      : `${COMBATANT_CLASS_NAME_STRINGS[mainClass]} / ${COMBATANT_CLASS_NAME_STRINGS[supportClass]}`;

  return `${classes}, ${CHARACTER_WEAPON_SPECIALTY_STRINGS[weaponSpecialty]}`;
}

export function AttainableAttributesTab() {
  const [specification, setSpecification] = useState(DEFAULT_SPECIFICATION);
  const [calculation, setCalculation] = useState<null | Calculation>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  function handleCalculate() {
    setIsCalculating(true);

    // fitting every set blocks, so it is queued behind the render that puts the spinner up rather
    // than done in the handler, where the spinner would never paint
    setTimeout(() => {
      const scoredSets = new AttainableAttributeCalculator().getScoredEquipmentSets(specification);
      setCalculation({ specification, scoredSets });
      setIsCalculating(false);
    }, 0);
  }

  return (
    <div>
      <BuildSpecificationControls
        specification={specification}
        setSpecification={setSpecification}
        disabled={isCalculating}
      />

      <div className="mb-4 flex items-center gap-4">
        <ButtonBasic
          onClick={handleCalculate}
          disabled={isCalculating}
          extraStyles="bg-theme-recessed"
        >
          calculate
        </ButtonBasic>

        {isCalculating && (
          <div className="flex items-center gap-3 text-sm text-theme-muted">
            <div className="h-5 w-5">
              <LoadingSpinner />
            </div>
            fitting every attainable set...
          </div>
        )}
      </div>

      {calculation !== null && (
        <div className="mb-4">
          <span className="block text-sm text-theme-muted">
            max attainable {COMBAT_ATTRIBUTE_STRINGS[calculation.specification.attribute]}
          </span>
          <span className="block text-4xl">{Math.floor(calculation.scoredSets.best.score)}</span>
          <span className="block text-sm text-theme-muted">
            {describeBuild(calculation.specification.buildSpec)}, level{" "}
            {calculation.specification.level}
          </span>
        </div>
      )}

      <div className="bg-theme-base p-2 border border-theme-muted overflow-auto">
        <DataTable
          columns={SCORED_EQUIPMENT_SET_COLUMNS}
          entries={calculation === null ? [] : calculation.scoredSets.sortedByScore}
          keyOf={(scoredSet) => scoredSet.setKey}
          emptyMessage="nothing calculated yet"
          layoutOption={DataTableLayout.FitContent}
        />
      </div>
    </div>
  );
}

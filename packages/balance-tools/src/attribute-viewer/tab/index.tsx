import { observer } from "mobx-react-lite";
import { COMBAT_ATTRIBUTE_STRINGS, COMBATANT_CLASS_NAME_STRINGS } from "@speed-dungeon/common";
import ButtonBasic from "@speed-dungeon/ui/atoms/ButtonBasic";
import { DataTable } from "@speed-dungeon/ui/atoms/DataTable";
import { DataTableLayout } from "@speed-dungeon/ui/atoms/DataTable/column";
import LoadingSpinner from "@speed-dungeon/ui/atoms/LoadingSpinner";
import { CharacterBuildSpecification } from "../../analysis-subjects/analysis-character-specification";
import { CHARACTER_WEAPON_SPECIALTY_STRINGS } from "../../analysis-subjects/character-weapon-specialty";
import { useBalanceToolsApplication } from "../../state/context";
import { BuildSpecificationControls } from "./build-specification-controls";
import { SCORED_EQUIPMENT_SET_COLUMNS } from "./scored-equipment-set-columns";

function describeBuild(buildSpec: CharacterBuildSpecification) {
  const { mainClass, supportClass, weaponSpecialty } = buildSpec;
  const classes =
    supportClass === null
      ? COMBATANT_CLASS_NAME_STRINGS[mainClass]
      : `${COMBATANT_CLASS_NAME_STRINGS[mainClass]} / ${COMBATANT_CLASS_NAME_STRINGS[supportClass]}`;

  return `${classes}, ${CHARACTER_WEAPON_SPECIALTY_STRINGS[weaponSpecialty]}`;
}

export const AttainableAttributesTab = observer(() => {
  const { attainableAttributes } = useBalanceToolsApplication();
  const { calculation, isCalculating } = attainableAttributes;

  return (
    <div>
      <BuildSpecificationControls />

      <div className="mb-4 flex items-center gap-4">
        <ButtonBasic
          onClick={() => attainableAttributes.calculate()}
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
});

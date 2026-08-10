import { SelectDropdown } from "@speed-dungeon/ui/atoms/SelectDropdown";
import { PartyDrawMode } from "@/analysis/available-damage/party-draw";
import { SPECIALTY_COMBOS } from "@/analysis/available-damage/specialty-combo";

const MODE_TITLES: Record<PartyDrawMode, string> = {
  [PartyDrawMode.EvenlyDistributed]: `Spread runs evenly over all ${SPECIALTY_COMBOS.length} combos`,
  [PartyDrawMode.GuaranteeCombo]: "Guarantee the selected combo in every run",
};

export function DrawModeToggle({
  mode,
  onChange,
  disabled,
}: {
  mode: PartyDrawMode;
  onChange: (mode: PartyDrawMode) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <SelectDropdown
        title="runs"
        value={mode}
        setValue={onChange}
        options={[PartyDrawMode.EvenlyDistributed, PartyDrawMode.GuaranteeCombo].map((option) => ({
          title: MODE_TITLES[option],
          value: option,
        }))}
        disabled={disabled}
      />
      <p className="text-sm text-theme-muted mt-1 max-w-3xl">
        Either way the party's three specialties are drawn without replacement, so no two characters
        compete for the same weapon type.
      </p>
    </div>
  );
}

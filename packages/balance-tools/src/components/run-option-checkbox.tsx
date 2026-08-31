import { useId } from "react";
import { Checkbox } from "@speed-dungeon/ui/atoms/Checkbox";

interface Props {
  label: string;
  checked: boolean;
  /** pinned by the study rather than chosen, so the control shows its value without offering it */
  isFixed: boolean;
  setChecked: (checked: boolean) => void;
}

export function RunOptionCheckbox({ label, checked, isFixed, setChecked }: Props) {
  const id = useId();

  return (
    <div className="h-10 flex items-center gap-2 text-sm text-theme-muted">
      <Checkbox
        extraStyles="h-5 w-5"
        id={id}
        ariaLabel={label}
        checked={checked}
        disabled={isFixed}
        setChecked={setChecked}
      />
      <label htmlFor={id} className={`cursor-pointer ${isFixed ? "opacity-50 cursor-auto" : ""}`}>
        {label}
      </label>
    </div>
  );
}

import { WeaponUsage } from "../analysis/available-damage/combo-samples";

/** Long enough to show what a specialty actually reaches for, short enough to stay in a cell. */
const WEAPONS_LISTED = 5;
export const NOTHING_TO_SHOW = "-";

/** Null and undefined both mean "this combo produced no sample here", which reads better as a dash
 * than as a zero that would average into the eye alongside real zeroes. */
export function formatOptionalNumber(value: undefined | null | number, digits = 1) {
  return value == null ? NOTHING_TO_SHOW : value.toFixed(digits);
}

/** How many to show is one decision; how to draw them is the medium's. The table stacks them a line
 * each and the terminal joins them onto one, so only the selection is shared. */
export function topWeaponUsage(weapons: undefined | WeaponUsage[]) {
  return (weapons ?? []).slice(0, WEAPONS_LISTED);
}

export function formatWeaponUsage(weapons: undefined | WeaponUsage[]) {
  const top = topWeaponUsage(weapons);
  if (top.length === 0) {
    return NOTHING_TO_SHOW;
  }
  return top.map(({ name, percent }) => `${name} ${percent.toFixed(0)}%`).join(", ");
}

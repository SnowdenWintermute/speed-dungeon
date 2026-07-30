import { PartyFate, PartyFateType } from "@speed-dungeon/common";
import { formatTimestamp } from "@/utils/format-timestamp";
import { NO_VALUE_TEXT } from "./display-text";

const PARTY_FATE_TYPE_STRINGS: Record<PartyFateType, string> = {
  [PartyFateType.Wipe]: "Wiped",
  [PartyFateType.Escape]: "Escaped",
};

// a party with no fate has neither wiped nor escaped, which for a game still being played is the
// ordinary case rather than a figure we are missing
export function partyFateText(fateOption: PartyFate | undefined): string {
  if (fateOption === undefined) {
    return NO_VALUE_TEXT;
  }
  return PARTY_FATE_TYPE_STRINGS[fateOption.type];
}

// for a page with no date of its own beside it. a game history row has a Date column, so there the
// bare fate is enough
export function partyFateAtTimeText(fateOption: PartyFate | undefined): string {
  if (fateOption === undefined) {
    return NO_VALUE_TEXT;
  }
  return `${partyFateText(fateOption)} at ${formatTimestamp(fateOption.timestamp)}`;
}

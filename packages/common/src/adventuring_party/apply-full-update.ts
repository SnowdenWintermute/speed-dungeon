import { AdventuringParty } from ".";

export default function applyFullUpdate(this: AdventuringParty, update: AdventuringParty) {
  Object.assign(this, update);
}

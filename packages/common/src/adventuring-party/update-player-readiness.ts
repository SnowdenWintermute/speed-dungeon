import { ArrayUtils } from "../utils/array-utils.js";
import { AdventuringParty } from "./index.js";

export enum DescendOrExplore {
  Explore,
  Descend,
}

export default function updatePlayerReadiness(
  party: AdventuringParty,
  username: string,
  descendOrExplore: DescendOrExplore
) {
  const wasReadyToDescend = ArrayUtils.removeElement(party.playersReadyToDescend, username);
  const wasReadyToExplore = ArrayUtils.removeElement(party.playersReadyToExplore, username);

  switch (descendOrExplore) {
    case DescendOrExplore.Explore:
      if (wasReadyToExplore === undefined) party.playersReadyToExplore.push(username);
      break;
    case DescendOrExplore.Descend:
      if (wasReadyToDescend === undefined) party.playersReadyToDescend.push(username);
      break;
  }
}

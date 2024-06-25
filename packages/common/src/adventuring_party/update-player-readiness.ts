import { AdventuringParty } from ".";
import { removeFromArray } from "../utils";

export enum DescendOrExplore {
  Explore,
  Descend,
}

export default function updatePlayerReadiness(
  party: AdventuringParty,
  username: string,
  descendOrExplore: DescendOrExplore
) {
  const wasReadyToDescend = removeFromArray(party.playersReadyToDescend, username);
  const wasReadyToExplore = removeFromArray(party.playersReadyToExplore, username);

  switch (descendOrExplore) {
    case DescendOrExplore.Explore:
      if (wasReadyToExplore === undefined) party.playersReadyToExplore.push(username);
      break;
    case DescendOrExplore.Descend:
      if (wasReadyToDescend === undefined) party.playersReadyToDescend.push(username);
      break;
  }
}

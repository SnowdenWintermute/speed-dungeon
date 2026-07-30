import { IdentityProviderId, Username } from "../../aliases.js";
import {
  LadderGameRecordAggregate,
  LadderPartyRecordAggregate,
} from "../records/ladder-records-persistence-strategy.js";
import { cumulativeTimeToClearFloor } from "../records/ladder-read-model-assembly.js";
import {
  GameRecordCharacterSnapshotLink,
  GameRecordFloorClearView,
  GameRecordPartyView,
  GameRecordView,
} from "./game-record.js";

// the whole-game read: takes the assembled record aggregate and resolves it into the client-facing
// view. the only thing it needs the caller for is usernames, which live at the identity provider
export function assembleGameRecordView(
  aggregate: LadderGameRecordAggregate,
  usernameOf: (id: IdentityProviderId) => Username
): GameRecordView {
  return {
    gameRecordId: aggregate.game.id,
    name: aggregate.game.name,
    mode: aggregate.game.mode,
    controlScheme: aggregate.game.controlScheme,
    timeStarted: aggregate.game.timeStarted,
    // participations, not the participant records: only the junction says whether they abandoned
    participants: aggregate.participations.map((participation) => ({
      username: usernameOf(participation.participantRecordId),
      abandonedAtOption: participation.abandonedAtOption,
    })),
    parties: aggregate.parties.map((party) => assemblePartyView(party, usernameOf)),
  };
}

function assemblePartyView(
  partyAggregate: LadderPartyRecordAggregate,
  usernameOf: (id: IdentityProviderId) => Username
): GameRecordPartyView {
  const snapshotLinksByClear = new Map<string, GameRecordCharacterSnapshotLink[]>();
  for (const character of partyAggregate.characters) {
    for (const snapshot of character.floorClearedSnapshots) {
      const forClear = snapshotLinksByClear.get(snapshot.partyFloorClearRecord) ?? [];
      forClear.push({ characterId: character.character.id, snapshotId: snapshot.id });
      snapshotLinksByClear.set(snapshot.partyFloorClearRecord, forClear);
    }
  }

  // storage hands these over unordered; shallow floors first is the order the page reads in
  const orderedClears = [...partyAggregate.floorClears].sort((a, b) => a.floor - b.floor);
  const floorClears: GameRecordFloorClearView[] = orderedClears.map((partyFloorClear) => ({
    id: partyFloorClear.id,
    controlScheme: partyFloorClear.controlScheme,
    floor: partyFloorClear.floor,
    timeSpentOnFloor: partyFloorClear.timeSpentOnFloor,
    // the aggregate holds this party's every clear, which is exactly what the running total sums
    cumulativeTimeToClearFloor: cumulativeTimeToClearFloor(
      partyFloorClear,
      partyAggregate.floorClears
    ),
    clearedAt: partyFloorClear.clearedAt,
    characterSnapshots: snapshotLinksByClear.get(partyFloorClear.id) ?? [],
  }));

  return {
    partyRecordId: partyAggregate.party.id,
    partyName: partyAggregate.party.name,
    fateOption: partyAggregate.party.fateOption,
    deepestFloorReached: partyAggregate.party.deepestFloorReached,
    characters: partyAggregate.characters.map(({ character }) => ({
      characterId: character.id,
      characterName: character.name,
      mainClass: character.mainClass,
      supportClassOption: character.supportClassOption,
      owner: usernameOf(character.controllingPlayerId),
    })),
    floorClears,
  };
}

import {
  invariant,
  LadderCharacterRecord,
  LadderGameRecordAggregate,
  LadderPartyRecordAggregate,
} from "@speed-dungeon/common";

// find a recorded party/owner by the character name a test created — the bridge from a client
// (whose participant IdentityProviderId isn't known up front) to the id-keyed read models.
export function requirePartyOfCharacter(
  aggregate: LadderGameRecordAggregate,
  characterName: string
): LadderPartyRecordAggregate {
  const party = aggregate.parties.find((partyAggregate) =>
    partyAggregate.characters.some((character) => character.character.name === characterName)
  );
  invariant(party !== undefined, `expected a recorded party containing "${characterName}"`);
  return party;
}

export function requireCharacterRecord(
  party: LadderPartyRecordAggregate,
  characterName: string
): LadderCharacterRecord {
  const character = party.characters.find((candidate) => candidate.character.name === characterName);
  invariant(character !== undefined, `expected character "${characterName}" in the party`);
  return character.character;
}

export function requireOwnerId(party: LadderPartyRecordAggregate, characterName: string) {
  return requireCharacterRecord(party, characterName).controllingPlayerId;
}

import {
  invariant,
  LadderGameRecordAggregate,
  LadderPartyRecordAggregate,
} from "@speed-dungeon/common";

// find the party a test's character was recorded in, for ground-truth expectations taken from the
// write path's own aggregate
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

import cloneDeep from "lodash.clonedeep";
import {
  IdentityProviderId,
  LadderCharacterFloorClearedRecordId,
  LadderGameRecordId,
  LadderParticipantRecordId,
  LadderPartyFloorClearedRecordId,
  LadderPartyRecordId,
  LadderCharacterRecordId,
} from "../../aliases.js";
import {
  LadderCharacterFloorClearedRecord,
  LadderParticipantRecord,
  LadderPartyFloorClearRecord,
} from "./index.js";
import {
  LadderCharacterRecordInsert,
  LadderGameRecordAggregate,
  LadderGameRecordInsert,
  LadderPartyFateUpdate,
  LadderPartyFloorClearWrite,
  LadderPartyRecordInsert,
  LadderRecordsPersistenceStrategy,
  NewLadderGameRecordSet,
} from "./ladder-records-persistence-strategy.js";

export class InMemoryLadderRecordsPersistenceStrategy implements LadderRecordsPersistenceStrategy {
  private games = new Map<LadderGameRecordId, LadderGameRecordInsert>();
  private participants = new Map<LadderParticipantRecordId, LadderParticipantRecord>();
  private gameParticipantLinks: {
    gameRecordId: LadderGameRecordId;
    participantRecordId: LadderParticipantRecordId;
  }[] = [];
  private parties = new Map<LadderPartyRecordId, LadderPartyRecordInsert>();
  private characters = new Map<LadderCharacterRecordId, LadderCharacterRecordInsert>();
  private partyFloorClears = new Map<LadderPartyFloorClearedRecordId, LadderPartyFloorClearRecord>();
  private characterFloorClearedSnapshots = new Map<
    LadderCharacterFloorClearedRecordId,
    LadderCharacterFloorClearedRecord
  >();

  async findParticipantRecordByUserId(
    userId: IdentityProviderId
  ): Promise<LadderParticipantRecord | undefined> {
    for (const participant of this.participants.values()) {
      if (participant.userId === userId) {
        return cloneDeep(participant);
      }
    }
    return undefined;
  }

  async upsertParticipantRecord(record: LadderParticipantRecord): Promise<void> {
    for (const existing of this.participants.values()) {
      // global per user, like ON CONFLICT (user_id) DO NOTHING
      if (existing.userId === record.userId) {
        return;
      }
    }
    this.participants.set(record.id, cloneDeep(record));
  }

  async insertNewGameRecordSet(set: NewLadderGameRecordSet): Promise<void> {
    const cloned = cloneDeep(set);
    this.games.set(cloned.game.id, cloned.game);
    for (const participantRecordId of cloned.participantRecordIds) {
      this.gameParticipantLinks.push({ gameRecordId: cloned.game.id, participantRecordId });
    }
    for (const party of cloned.parties) {
      this.parties.set(party.id, party);
    }
    for (const character of cloned.characters) {
      this.characters.set(character.id, character);
    }
  }

  async recordPartyFloorClear(write: LadderPartyFloorClearWrite): Promise<void> {
    const cloned = cloneDeep(write);
    this.partyFloorClears.set(cloned.partyFloorClear.id, cloned.partyFloorClear);
    for (const snapshot of cloned.characterSnapshots) {
      this.characterFloorClearedSnapshots.set(snapshot.id, snapshot);
    }
    const party = this.parties.get(cloned.partyRecordId);
    if (party) {
      party.deepestFloorReached = cloned.deepestFloorReached;
    }
    for (const levelUpdate of cloned.characterLevelUpdates) {
      const character = this.characters.get(levelUpdate.characterRecordId);
      if (character !== undefined) {
        character.mainClassLevel = levelUpdate.mainClassLevel;
        if (levelUpdate.supportClassLevel !== undefined && character.supportClassOption !== undefined) {
          character.supportClassOption.level = levelUpdate.supportClassLevel;
        }
      }
    }
  }

  async updatePartyFate(update: LadderPartyFateUpdate): Promise<void> {
    const party = this.parties.get(update.partyRecordId);
    if (party) {
      party.fateOption = cloneDeep(update.fate);
      party.deepestFloorReached = update.deepestFloorReached;
    }
  }

  async findGameRecordAggregateById(
    id: LadderGameRecordId
  ): Promise<LadderGameRecordAggregate | undefined> {
    const game = this.games.get(id);
    if (game === undefined) {
      return undefined;
    }

    const participantIds = new Set(
      this.gameParticipantLinks
        .filter((link) => link.gameRecordId === id)
        .map((link) => link.participantRecordId)
    );
    const participants = [...this.participants.values()].filter((participant) =>
      participantIds.has(participant.id)
    );

    const parties = [...this.parties.values()]
      .filter((party) => party.gameRecordId === id)
      .map((party) => ({
        party,
        floorClears: [...this.partyFloorClears.values()].filter(
          (floorClear) => floorClear.partyRecordRef === party.id
        ),
        characters: [...this.characters.values()]
          .filter((character) => character.partyRecordId === party.id)
          .map((character) => ({
            character,
            floorClearedSnapshots: [...this.characterFloorClearedSnapshots.values()].filter(
              (snapshot) => snapshot.characterRecordRef === character.id
            ),
          })),
      }));

    return cloneDeep({ game, participants, parties });
  }
}

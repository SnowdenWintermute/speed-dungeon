// this script is run straight from source with node's type stripping, which cannot tell a type
// import from a value one — so the types have to say so
import {
  AffixGenerator,
  APP_VERSION_NUMBER,
  BasicRandomNumberGenerator,
  CharacterControlScheme,
  CombatantClass,
  COMBATANT_MAX_LEVEL,
  DefaultCharacterCreationPolicy,
  EquipmentRandomizer,
  GameMode,
  IdGeneratorRandom,
  ItemBuilder,
  LootGenerator,
  MonsterGenerator,
  ONE_SECOND,
  PartyFateType,
  RANDOM_PARTY_NAMES,
  RandomNumberGenerationPolicyFactory,
} from "@speed-dungeon/common";
import type {
  Combatant,
  CombatantWithPets,
  EntityName,
  GameId,
  IdentityProviderId,
  LadderCharacterFloorClearRecord,
  LadderCharacterFloorClearRecordId,
  LadderCharacterRecord,
  LadderGameRecord,
  LadderParticipantRecord,
  LadderPartyFloorClearRecord,
  LadderPartyFloorClearRecordId,
  LadderPartyRecord,
  Milliseconds,
  PartyFate,
  PartyId,
  PartyName,
  SerializedCombatantWithPets,
  SerializedOf,
  Username,
} from "@speed-dungeon/common";
import {
  DatabaseLadderRecordsPersistenceStrategy,
  getUserIdsByUsername,
  loadLadderIntoKvStore,
  pgOptions,
  pgPool,
  playerCharactersRepo,
  valkeyManager,
} from "@speed-dungeon/server";
import format from "pg-format";
import cloneDeep from "lodash.clonedeep";
import { SeedCharacterLoadout } from "./seed-character-loadout.ts";
import { SeedAttributeAllocation } from "./seed-attribute-allocation.ts";

// must match snowauth/dev-accounts/fake-usernames.txt — that script creates the accounts, this one
// resolves them by name, since deleting and recreating them issues new ids
const SEED_OWNER_USERNAMES = [
  "Thraxis",
  "Bellamira",
  "Corvin_Vale",
  "Dunnhilde",
  "Eskarion",
  "Fennwick",
  "Gaustav",
  "Halcyon_Rue",
] as Username[];

// everything this script writes is identified by these, so a re-run replaces its own data and leaves
// anything you made by playing alone
const SEED_GAME_NAME_PREFIX = "[seed]";

const CHARACTERS_PER_OWNER_PER_SCHEME = 3;
const GAMES_PER_OWNER = 3;
const SUPPORT_CLASS_EVERY_NTH_CHARACTER = 3;
const PETS_EVERY_NTH_CHARACTER = 3;
const MAX_PETS_PER_CHARACTER = 2;
const MAX_PARTIES_PER_GAME = 3;
const ABANDONED_EVERY_NTH_GAME = 4;
const DELETE_ONLY_FLAG = "--delete-only";
const CONTROL_SCHEMES = [CharacterControlScheme.Freelancer, CharacterControlScheme.Captain];
const CHARACTER_CLASSES = [CombatantClass.Warrior, CombatantClass.Mage, CombatantClass.Rogue];

// ids the identity provider will never issue, standing in for accounts deleted after they played.
// the ladder has to keep showing their history, falling back to lastKnownUsername
const DELETED_ACCOUNT_PARTICIPANTS: LadderParticipantRecord[] = [
  { id: 900001 as IdentityProviderId, lastKnownUsername: "Ashvane_Mor" as Username },
  { id: 900002 as IdentityProviderId, lastKnownUsername: "Quillon_Sable" as Username },
  { id: 900003 as IdentityProviderId, lastKnownUsername: "Peregrine_Ash" as Username },
];
const DELETED_ACCOUNT_PARTY_EVERY_NTH = 5;

const idGenerator = new IdGeneratorRandom({ saveHistory: false });
const ladderRecords = new DatabaseLadderRecordsPersistenceStrategy();

const rngPolicy = RandomNumberGenerationPolicyFactory.allRandomPolicy();
const itemBuilder = new ItemBuilder(new EquipmentRandomizer(rngPolicy, new AffixGenerator(rngPolicy)));
const characterCreationPolicy = new DefaultCharacterCreationPolicy(
  idGenerator,
  itemBuilder,
  rngPolicy
);

const rng = new BasicRandomNumberGenerator();
const characterLoadout = new SeedCharacterLoadout(
  new LootGenerator(itemBuilder, idGenerator, rngPolicy),
  new MonsterGenerator(idGenerator, itemBuilder, rng)
);
const attributeAllocation = new SeedAttributeAllocation();

async function main() {
  // importing the server's database config loads its .env, so this reads what the server would
  if (process.env.NODE_ENV === "production") {
    throw new Error("refusing to seed fake ladder data in production");
  }

  // seeding always deletes first, so the two modes differ only in whether they write afterwards
  const isDeleteOnly = process.argv.includes(DELETE_ONLY_FLAG);

  pgPool.connect(pgOptions);
  await valkeyManager.context.connect();

  const ownerIdsByUsername = await resolveSeedOwners();

  await deletePreviouslySeededData([...ownerIdsByUsername.values()]);

  if (!isDeleteOnly) {
    const charactersCreated = await seedProgressionCharacters(ownerIdsByUsername);
    await seedGamesAndFloorClears(ownerIdsByUsername);
    console.info(
      `seeded ${charactersCreated} progression characters and their floor clears for ` +
        `${ownerIdsByUsername.size} owners`
    );
  } else {
    console.info(`deleted the seeded ladder data of ${ownerIdsByUsername.size} owners`);
  }

  // the experience points boards are sorted sets rebuilt from the saved characters in the database.
  // needed on the way out of both modes: deleting characters has to drop them off the board too.
  // the lobby does this on boot as well, so a restart is not required
  await loadLadderIntoKvStore();

  await valkeyManager.context.client.quit();
  pgPool.close();
}

// the game's own party names, the same pool the lobby draws from when a party is created without one
function randomPartyName(): PartyName {
  const name = RANDOM_PARTY_NAMES[Math.floor(Math.random() * RANDOM_PARTY_NAMES.length)];
  if (name === undefined) {
    throw new Error("expected a random party name");
  }
  return name as PartyName;
}

// resolved by name rather than id: the accounts can be torn down and recreated, which issues new ids
async function resolveSeedOwners(): Promise<Map<Username, IdentityProviderId>> {
  const result = await getUserIdsByUsername(SEED_OWNER_USERNAMES);
  if (result instanceof Error) {
    throw result;
  }

  const ownerIdsByUsername = new Map<Username, IdentityProviderId>();
  const missing: Username[] = [];
  for (const username of SEED_OWNER_USERNAMES) {
    const idOption = result[username];
    if (idOption === undefined) {
      missing.push(username);
      continue;
    }
    ownerIdsByUsername.set(username, idOption as IdentityProviderId);
  }

  if (missing.length > 0) {
    throw new Error(
      `no account for ${missing.join(", ")} — run snowauth/dev-accounts/create-fake-accounts.sh first`
    );
  }

  return ownerIdsByUsername;
}

// a re-run replaces what the last run wrote. games cascade to their parties, clears and snapshots.
// the stand-in deleted accounts are seeded data too, so they go with everything else
async function deletePreviouslySeededData(ownerIds: IdentityProviderId[]): Promise<void> {
  const participantIds = [
    ...ownerIds,
    ...DELETED_ACCOUNT_PARTICIPANTS.map((participant) => participant.id),
  ];

  await pgPool.query(
    format(`DELETE FROM ladder_game_records WHERE name LIKE %L;`, `${SEED_GAME_NAME_PREFIX}%`)
  );
  await pgPool.query(
    format(`DELETE FROM player_characters WHERE owner_id IN (%L);`, ownerIds)
  );
  await pgPool.query(
    format(`DELETE FROM ladder_participant_records WHERE id IN (%L);`, participantIds)
  );
}

// the experience points boards read saved progression characters, so this is all they need
async function seedProgressionCharacters(
  ownerIdsByUsername: Map<Username, IdentityProviderId>
): Promise<number> {
  let created = 0;

  for (const controlScheme of CONTROL_SCHEMES) {
    let characterIndex = 0;

    for (const [username, ownerId] of ownerIdsByUsername) {
      for (let owned = 0; owned < CHARACTERS_PER_OWNER_PER_SCHEME; owned += 1) {
        const character = buildCharacter(username, characterIndex, controlScheme);
        const pets = petsFor(character, characterIndex);
        await playerCharactersRepo.insert(character, pets, ownerId, controlScheme);
        characterIndex += 1;
        created += 1;
      }
    }
  }

  return created;
}

function buildCharacter(
  ownerUsername: Username,
  characterIndex: number,
  controlScheme: CharacterControlScheme
): Combatant {
  const combatantClass = CHARACTER_CLASSES[characterIndex % CHARACTER_CLASSES.length];
  if (combatantClass === undefined) {
    throw new Error("expected a class for every character index");
  }

  // an empty name makes the creation policy roll one of the game's own random names, the same way a
  // character created without typing a name gets one
  const { combatant } = characterCreationPolicy.createCharacter(
    "" as EntityName,
    combatantClass,
    ownerUsername
  );

  // level and current experience are what the board ranks on, and are read straight back out of the
  // serialized combatant. spread so the two schemes do not produce identical boards.
  // the stride is coprime with the range so levels cover it evenly — a stride sharing a factor with
  // the range (3 and 9) would collapse every support-class character onto the same few levels.
  // the range stops at the game's own ceiling: past it there is no equipment to roll and no floor
  // deep enough to have earned the level
  const { classProgressionProperties } = combatant.combatantProperties;
  const offset = controlScheme === CharacterControlScheme.Freelancer ? 0 : 1;
  const levelSpread = COMBATANT_MAX_LEVEL - 1;
  classProgressionProperties.getMainClass().level =
    2 + ((characterIndex * 7 + offset) % levelSpread);
  classProgressionProperties.experiencePoints.changeExperience(50 * (characterIndex % 7) + 10);

  if (characterIndex % SUPPORT_CLASS_EVERY_NTH_CHARACTER === 0) {
    const supportClass = CHARACTER_CLASSES[(characterIndex + 1) % CHARACTER_CLASSES.length];
    if (supportClass === undefined) {
      throw new Error("expected a support class");
    }
    classProgressionProperties.setSupportClass(supportClass, 1 + (characterIndex % 5));
  }

  // after the level is set, so generated gear is rolled at the level the character actually is
  characterLoadout.outfit(combatant, characterIndex);
  // after the gear, so the points can be spent on meeting its requirements
  attributeAllocation.allocate(combatant);

  return combatant;
}

function petsFor(combatant: Combatant, characterIndex: number): Combatant[] {
  if (characterIndex % PETS_EVERY_NTH_CHARACTER !== 0) {
    return [];
  }
  const petCount = 1 + (characterIndex % MAX_PETS_PER_CHARACTER);
  return characterLoadout.buildPets(combatant, characterIndex, petCount);
}

// several games per owner, each party clearing several floors, so both the cumulative board and the
// per-floor boards have more rows than a page holds
async function seedGamesAndFloorClears(
  ownerIdsByUsername: Map<Username, IdentityProviderId>
): Promise<void> {
  const owners = [...ownerIdsByUsername.entries()];
  const gameCount = owners.length * GAMES_PER_OWNER;

  for (let gameIndex = 0; gameIndex < gameCount; gameIndex += 1) {
    // mode and scheme must not both key off gameIndex % 2, or every freelancer clear is ironman and
    // every captain clear a race. real boards mix them, so these advance at different rates
    const mode = gameIndex % 2 === 0 ? GameMode.Ironman : GameMode.RankedRace;
    const controlScheme =
      CONTROL_SCHEMES[Math.floor(gameIndex / 2) % CONTROL_SCHEMES.length];
    if (controlScheme === undefined) {
      throw new Error("expected a control scheme for every game");
    }

    const startedAt = Date.now() - (gameIndex + 1) * 60 * 60 * ONE_SECOND;
    const gameId = idGenerator.generate() as GameId;

    // races are run by several parties competing in one game; an ironman run is one party's own
    const partyCount =
      mode === GameMode.RankedRace ? 1 + (gameIndex % MAX_PARTIES_PER_GAME) : 1;

    const parties: LadderPartyRecord[] = [];
    const characterRecords: LadderCharacterRecord[] = [];
    const floorClearsByParty: { partyId: PartyId; floors: number; combatants: CombatantWithPets[] }[] =
      [];
    const participantsById = new Map<IdentityProviderId, LadderParticipantRecord>();

    for (let partyIndex = 0; partyIndex < partyCount; partyIndex += 1) {
      // a freelancer party is one character per player; a captain's is one player running several.
      // so who is in the party follows the scheme rather than being the same shape on both boards
      const partySize = 1 + ((gameIndex + partyIndex) % 3);
      const startIndex = gameIndex + partyIndex * partySize;
      const partyOwners =
        controlScheme === CharacterControlScheme.Freelancer
          ? ownersStartingAt(owners, startIndex, partySize)
          : ownersStartingAt(owners, startIndex, 1);

      // some parties are run by accounts that have since been deleted, so their history has to
      // survive on lastKnownUsername alone
      const deletedOwnerOption = deletedOwnerFor(gameIndex, partyIndex);
      const effectiveOwners =
        deletedOwnerOption === undefined
          ? partyOwners
          : [deletedOwnerAsOwnerEntry(deletedOwnerOption), ...partyOwners.slice(1)];

      const leadOwner = effectiveOwners[0];
      if (leadOwner === undefined) {
        throw new Error("expected at least one owner in every party");
      }

      for (const [username, id] of effectiveOwners) {
        participantsById.set(id, { id, lastKnownUsername: username });
      }

      const partyId = idGenerator.generate() as PartyId;
      const floorsCleared = 3 + ((gameIndex + partyIndex) % 5);
      const characters = buildPartyCharacters(
        effectiveOwners,
        partyId,
        gameIndex + partyIndex,
        partySize
      );

      parties.push({
        id: partyId,
        gameRecordId: gameId,
        name: randomPartyName(),
        fateOption: partyFateFor(gameIndex, partyIndex, startedAt),
        deepestFloorReached: floorsCleared,
      });
      characterRecords.push(...characters.records);
      floorClearsByParty.push({
        partyId,
        floors: floorsCleared,
        combatants: characters.combatants,
      });
    }

    const leadPartyOwner = [...participantsById.values()][0];
    if (leadPartyOwner === undefined) {
      throw new Error("expected at least one participant in every game");
    }

    const participantRecords = [...participantsById.values()];

    const game: LadderGameRecord = {
      id: gameId,
      createdAt: startedAt,
      updatedAt: startedAt,
      name: `${SEED_GAME_NAME_PREFIX} ${leadPartyOwner.lastKnownUsername}'s run` as
        LadderGameRecord["name"],
      mode,
      controlScheme,
      timeStarted: startedAt,
    };

    for (const participantRecord of participantRecords) {
      await ladderRecords.upsertParticipantRecord(participantRecord);
    }
    await ladderRecords.insertNewGameRecordSet({
      game,
      participantRecords,
      parties,
      characters: characterRecords,
    });

    for (const partyClears of floorClearsByParty) {
      let clearedAt = startedAt;
      for (let floor = 1; floor <= partyClears.floors; floor += 1) {
        // varied enough that sorting by floor time and by cumulative time disagree, which is the
        // whole point of having two sortable columns
        const timeSpentOnFloor = (90 + ((gameIndex * 37 + floor * 53) % 240)) * ONE_SECOND;
        clearedAt += timeSpentOnFloor + 15 * ONE_SECOND;

        await recordFloorClear({
          partyId: partyClears.partyId,
          floor,
          timeSpentOnFloor,
          clearedAt,
          controlScheme,
          combatants: partyClears.combatants,
        });
      }
    }

    // an abandoned run is a participation the player walked away from, which is a different state
    // from the party wiping or escaping — the game itself never resolves
    if (gameIndex % ABANDONED_EVERY_NTH_GAME === 0) {
      await ladderRecords.recordRunAbandonment(
        gameId,
        leadPartyOwner.id,
        startedAt + 30 * 60 * ONE_SECOND
      );
    }
  }
}

// a party that wiped or is still underway is as much a part of the history as one that escaped
function partyFateFor(
  gameIndex: number,
  partyIndex: number,
  startedAt: Milliseconds
): undefined | PartyFate {
  switch ((gameIndex + partyIndex) % 4) {
    case 0:
      return { type: PartyFateType.Wipe, timestamp: startedAt };
    // no fate at all: the run never finished
    case 1:
      return undefined;
    default:
      return { type: PartyFateType.Escape, timestamp: startedAt };
  }
}

function deletedOwnerFor(
  gameIndex: number,
  partyIndex: number
): undefined | LadderParticipantRecord {
  if ((gameIndex + partyIndex) % DELETED_ACCOUNT_PARTY_EVERY_NTH !== 0) {
    return undefined;
  }
  return DELETED_ACCOUNT_PARTICIPANTS[
    (gameIndex + partyIndex) % DELETED_ACCOUNT_PARTICIPANTS.length
  ];
}

function deletedOwnerAsOwnerEntry(
  participant: LadderParticipantRecord
): [Username, IdentityProviderId] {
  const { lastKnownUsername } = participant;
  if (lastKnownUsername === undefined) {
    throw new Error("seeded deleted accounts always carry a last known username");
  }
  return [lastKnownUsername, participant.id];
}

function ownersStartingAt(
  owners: [Username, IdentityProviderId][],
  startIndex: number,
  count: number
): [Username, IdentityProviderId][] {
  const selected: [Username, IdentityProviderId][] = [];
  for (let offset = 0; offset < count; offset += 1) {
    const owner = owners[(startIndex + offset) % owners.length];
    if (owner === undefined) {
      throw new Error("expected an owner at every index");
    }
    selected.push(owner);
  }
  return selected;
}

function buildPartyCharacters(
  partyOwners: [Username, IdentityProviderId][],
  partyId: PartyId,
  gameIndex: number,
  characterCount: number
): { records: LadderCharacterRecord[]; combatants: CombatantWithPets[] } {
  const records: LadderCharacterRecord[] = [];
  const combatants: CombatantWithPets[] = [];

  for (let index = 0; index < characterCount; index += 1) {
    // a freelancer party has one owner per character; a captain's characters all share theirs
    const owner = partyOwners[index % partyOwners.length];
    if (owner === undefined) {
      throw new Error("expected an owner for every character");
    }
    const [username, ownerId] = owner;

    const characterIndex = gameIndex * 3 + index;
    const combatant = buildCharacter(username, characterIndex, CharacterControlScheme.Captain);
    combatants.push({ combatant, pets: petsFor(combatant, characterIndex) });

    const { classProgressionProperties } = combatant.combatantProperties;
    const mainClass = classProgressionProperties.getMainClass();
    const supportClassOption = classProgressionProperties.getSupportClassOption();

    records.push({
      id: combatant.getEntityId(),
      name: combatant.entityProperties.name,
      mainClass: { combatantClass: mainClass.combatantClass, level: mainClass.level },
      supportClassOption:
        supportClassOption === null
          ? undefined
          : {
              combatantClass: supportClassOption.combatantClass,
              level: supportClassOption.level,
            },
      controllingPlayerId: ownerId,
      partyRecordId: partyId,
    });
  }

  return { records, combatants };
}

async function recordFloorClear(args: {
  partyId: PartyId;
  floor: number;
  timeSpentOnFloor: Milliseconds;
  clearedAt: Milliseconds;
  controlScheme: CharacterControlScheme;
  combatants: CombatantWithPets[];
}): Promise<void> {
  const floorClearId = idGenerator.generate() as LadderPartyFloorClearRecordId;

  const partyFloorClear: LadderPartyFloorClearRecord = {
    id: floorClearId,
    partyRecordRef: args.partyId,
    floor: args.floor,
    timeSpentOnFloor: args.timeSpentOnFloor,
    controlScheme: args.controlScheme,
    clearedAt: args.clearedAt,
  };

  const characterFloorClears = args.combatants.map(({ combatant, pets }) => {
    const characterFloorClear: LadderCharacterFloorClearRecord = {
      id: idGenerator.generate() as LadderCharacterFloorClearRecordId,
      combatantSchemaVersion: APP_VERSION_NUMBER,
      partyFloorClearRecord: floorClearId,
      characterRecordRef: combatant.getEntityId(),
      combatantWithPets: snapshotOf(combatant, pets),
    };
    return characterFloorClear;
  });

  await ladderRecords.recordPartyFloorClear(partyFloorClear, characterFloorClears);
}

// snapshots are stored without inventory, as the write path stores them. pets are part of the build
// meta the snapshot exists to capture, so they travel with their owner
function snapshotOf(combatant: Combatant, ownedPets: Combatant[]): SerializedCombatantWithPets {
  const combatantLessInventory = cloneDeep(combatant);
  combatantLessInventory.combatantProperties.inventory.deleteAllItems();

  const pets: SerializedOf<Combatant>[] = ownedPets.map((pet) => {
    const petLessInventory = cloneDeep(pet);
    petLessInventory.combatantProperties.inventory.deleteAllItems();
    return petLessInventory.toSerialized();
  });

  return { combatant: combatantLessInventory.toSerialized(), pets };
}

await main();

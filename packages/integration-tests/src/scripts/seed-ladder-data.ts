// this script is run straight from source with node's type stripping, which cannot tell a type
// import from a value one — so the types have to say so
import {
  AffixGenerator,
  APP_VERSION_NUMBER,
  CharacterControlScheme,
  CombatantClass,
  DefaultCharacterCreationPolicy,
  EquipmentRandomizer,
  GameMode,
  IdGeneratorRandom,
  ItemBuilder,
  ONE_SECOND,
  PartyFateType,
  RANDOM_PARTY_NAMES,
  RandomNumberGenerationPolicyFactory,
} from "@speed-dungeon/common";
import type {
  Combatant,
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
const DELETE_ONLY_FLAG = "--delete-only";
const CONTROL_SCHEMES = [CharacterControlScheme.Freelancer, CharacterControlScheme.Captain];
const CHARACTER_CLASSES = [CombatantClass.Warrior, CombatantClass.Mage, CombatantClass.Rogue];

const idGenerator = new IdGeneratorRandom({ saveHistory: false });
const ladderRecords = new DatabaseLadderRecordsPersistenceStrategy();

const rngPolicy = RandomNumberGenerationPolicyFactory.allRandomPolicy();
const characterCreationPolicy = new DefaultCharacterCreationPolicy(
  idGenerator,
  new ItemBuilder(new EquipmentRandomizer(rngPolicy, new AffixGenerator(rngPolicy))),
  rngPolicy
);

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

// a re-run replaces what the last run wrote. games cascade to their parties, clears and snapshots
async function deletePreviouslySeededData(ownerIds: IdentityProviderId[]): Promise<void> {
  await pgPool.query(
    format(`DELETE FROM ladder_game_records WHERE name LIKE %L;`, `${SEED_GAME_NAME_PREFIX}%`)
  );
  await pgPool.query(
    format(`DELETE FROM player_characters WHERE owner_id IN (%L);`, ownerIds)
  );
  await pgPool.query(
    format(`DELETE FROM ladder_participant_records WHERE id IN (%L);`, ownerIds)
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
        await playerCharactersRepo.insert(character, [], ownerId, controlScheme);
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
  // the range (3 and 18) would collapse every support-class character onto the same few levels
  const { classProgressionProperties } = combatant.combatantProperties;
  const offset = controlScheme === CharacterControlScheme.Freelancer ? 0 : 1;
  classProgressionProperties.getMainClass().level = 2 + ((characterIndex * 7 + offset) % 18);
  classProgressionProperties.experiencePoints.changeExperience(50 * (characterIndex % 7) + 10);

  if (characterIndex % SUPPORT_CLASS_EVERY_NTH_CHARACTER === 0) {
    const supportClass = CHARACTER_CLASSES[(characterIndex + 1) % CHARACTER_CLASSES.length];
    if (supportClass === undefined) {
      throw new Error("expected a support class");
    }
    classProgressionProperties.setSupportClass(supportClass, 1 + (characterIndex % 5));
  }

  return combatant;
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

    // a freelancer party is one character per player; a captain's is one player running several. so
    // who is in the party follows the scheme rather than being the same shape on both boards
    const partySize = 1 + (gameIndex % 3);
    const partyOwners =
      controlScheme === CharacterControlScheme.Freelancer
        ? ownersStartingAt(owners, gameIndex, partySize)
        : ownersStartingAt(owners, gameIndex, 1);

    const leadOwner = partyOwners[0];
    if (leadOwner === undefined) {
      throw new Error("expected at least one owner in every party");
    }

    const floorsCleared = 3 + (gameIndex % 5);
    const startedAt = Date.now() - (gameIndex + 1) * 60 * 60 * ONE_SECOND;

    const gameId = idGenerator.generate() as GameId;
    const partyId = idGenerator.generate() as PartyId;

    const participantRecords: LadderParticipantRecord[] = partyOwners.map(([username, id]) => ({
      id,
      lastKnownUsername: username,
    }));

    const characters = buildPartyCharacters(partyOwners, partyId, gameIndex, partySize);

    const game: LadderGameRecord = {
      id: gameId,
      createdAt: startedAt,
      updatedAt: startedAt,
      name: `${SEED_GAME_NAME_PREFIX} ${leadOwner[0]}'s run` as LadderGameRecord["name"],
      mode,
      controlScheme,
      timeStarted: startedAt,
    };

    const party: LadderPartyRecord = {
      id: partyId,
      gameRecordId: gameId,
      name: randomPartyName(),
      fateOption: { type: PartyFateType.Escape, timestamp: startedAt },
      deepestFloorReached: floorsCleared,
    };

    for (const participantRecord of participantRecords) {
      await ladderRecords.upsertParticipantRecord(participantRecord);
    }
    await ladderRecords.insertNewGameRecordSet({
      game,
      participantRecords,
      parties: [party],
      characters: characters.records,
    });

    let clearedAt = startedAt;
    for (let floor = 1; floor <= floorsCleared; floor += 1) {
      // varied enough that sorting by floor time and by cumulative time disagree, which is the whole
      // point of having two sortable columns
      const timeSpentOnFloor = (90 + ((gameIndex * 37 + floor * 53) % 240)) * ONE_SECOND;
      clearedAt += timeSpentOnFloor + 15 * ONE_SECOND;

      await recordFloorClear({
        partyId,
        floor,
        timeSpentOnFloor,
        clearedAt,
        controlScheme,
        combatants: characters.combatants,
      });
    }
  }
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
): { records: LadderCharacterRecord[]; combatants: Combatant[] } {
  const records: LadderCharacterRecord[] = [];
  const combatants: Combatant[] = [];

  for (let index = 0; index < characterCount; index += 1) {
    // a freelancer party has one owner per character; a captain's characters all share theirs
    const owner = partyOwners[index % partyOwners.length];
    if (owner === undefined) {
      throw new Error("expected an owner for every character");
    }
    const [username, ownerId] = owner;

    const combatant = buildCharacter(username, gameIndex * 3 + index, CharacterControlScheme.Captain);
    combatants.push(combatant);

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
  combatants: Combatant[];
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

  const characterFloorClears = args.combatants.map((combatant) => {
    const characterFloorClear: LadderCharacterFloorClearRecord = {
      id: idGenerator.generate() as LadderCharacterFloorClearRecordId,
      combatantSchemaVersion: APP_VERSION_NUMBER,
      partyFloorClearRecord: floorClearId,
      characterRecordRef: combatant.getEntityId(),
      combatantWithPets: snapshotOf(combatant),
    };
    return characterFloorClear;
  });

  await ladderRecords.recordPartyFloorClear(partyFloorClear, characterFloorClears);
}

// snapshots are stored without inventory, as the write path stores them
function snapshotOf(combatant: Combatant): SerializedCombatantWithPets {
  const combatantLessInventory = cloneDeep(combatant);
  combatantLessInventory.combatantProperties.inventory.deleteAllItems();
  const pets: SerializedOf<Combatant>[] = [];
  return { combatant: combatantLessInventory.toSerialized(), pets };
}

await main();

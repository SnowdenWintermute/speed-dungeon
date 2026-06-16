exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TYPE combatant_class AS ENUM ('warrior', 'rogue', 'mage');
    CREATE TYPE party_fate_type AS ENUM ('wipe', 'escape');

    -- one row per user, shared across all of their games. The primary key IS the
    -- IdentityProviderId. We resolve a current username live from it, and only fall
    -- back to the stored name once the account is deleted.
    CREATE TABLE ladder_participant_records (
        id INT PRIMARY KEY,
        username_at_time_of_account_deletion VARCHAR(128)
    );

    CREATE TABLE ladder_game_records (
        id UUID PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        name VARCHAR(128) NOT NULL,
        mode VARCHAR(32) NOT NULL,
        control_scheme VARCHAR(32) NOT NULL,
        time_started TIMESTAMP WITH TIME ZONE
    );

    -- game <-> participant is many-to-many (a game has several participants, a
    -- participant appears in many games), so it gets a join table rather than an
    -- array column on either side.
    CREATE TABLE ladder_game_participant_records (
        game_record_id UUID REFERENCES ladder_game_records(id) ON DELETE CASCADE,
        participant_record_id INT REFERENCES ladder_participant_records(id) ON DELETE CASCADE,
        PRIMARY KEY (game_record_id, participant_record_id)
    );

    CREATE TABLE ladder_party_records (
        id UUID PRIMARY KEY,
        game_record_id UUID REFERENCES ladder_game_records(id) ON DELETE CASCADE,
        name VARCHAR(128) NOT NULL,
        fate_type party_fate_type,
        fate_timestamp TIMESTAMP WITH TIME ZONE,
        deepest_floor_reached INT NOT NULL DEFAULT 1
    );

    -- time_spent_on_floor is a duration in milliseconds, not a wall-clock time
    CREATE TABLE ladder_party_floor_clear_records (
        id UUID PRIMARY KEY,
        party_record_ref UUID REFERENCES ladder_party_records(id) ON DELETE CASCADE,
        floor INT NOT NULL,
        time_spent_on_floor BIGINT NOT NULL,
        UNIQUE (party_record_ref, floor)
    );

    -- denormalized last-known summary of a character for cheap filtering without
    -- deserializing the snapshot blobs
    CREATE TABLE ladder_character_records (
        id UUID PRIMARY KEY,
        party_record_id UUID REFERENCES ladder_party_records(id) ON DELETE CASCADE,
        controlling_player_id INT NOT NULL REFERENCES ladder_participant_records(id),
        name VARCHAR(128) NOT NULL,
        main_class combatant_class NOT NULL,
        main_class_level INT NOT NULL,
        support_class_option combatant_class,
        support_class_option_level INT
    );

    -- full serialized character + pets (each minus inventory) at each floor clear, for build meta analysis
    CREATE TABLE ladder_character_floor_cleared_records (
        id UUID PRIMARY KEY,
        character_record_ref UUID REFERENCES ladder_character_records(id) ON DELETE CASCADE,
        party_floor_clear_record UUID REFERENCES ladder_party_floor_clear_records(id) ON DELETE CASCADE,
        combatant_schema_version VARCHAR(16) NOT NULL,
        combatant_with_pets JSONB NOT NULL
    );

    CREATE INDEX idx_ladder_game_participant_records_participant ON ladder_game_participant_records (participant_record_id);
    CREATE INDEX idx_ladder_party_records_game_record_id ON ladder_party_records (game_record_id);
    -- "best clear times on floor N" leaderboard; also covers lookups by party_record_ref
    -- alone? No - that is already served by the UNIQUE (party_record_ref, floor) index.
    CREATE INDEX idx_ladder_party_floor_clear_records_floor_time ON ladder_party_floor_clear_records (floor, time_spent_on_floor);
    CREATE INDEX idx_ladder_character_records_party ON ladder_character_records (party_record_id);
    CREATE INDEX idx_ladder_character_records_controlling_player ON ladder_character_records (controlling_player_id);
    CREATE INDEX idx_ladder_character_floor_cleared_records_character ON ladder_character_floor_cleared_records (character_record_ref);
    CREATE INDEX idx_ladder_character_floor_cleared_records_party_floor ON ladder_character_floor_cleared_records (party_floor_clear_record);
    CREATE INDEX idx_ladder_game_records_time_started ON ladder_game_records (time_started);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE ladder_character_floor_cleared_records;
    DROP TABLE ladder_character_records;
    DROP TABLE ladder_party_floor_clear_records;
    DROP TABLE ladder_party_records;
    DROP TABLE ladder_game_participant_records;
    DROP TABLE ladder_game_records;
    DROP TABLE ladder_participant_records;
    DROP TYPE party_fate_type;
    DROP TYPE combatant_class;
  `);
};

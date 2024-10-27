exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE race_game_records (
        id SERIAL PRIMARY KEY,
        game_name VARCHAR(128) NOT NULL,
        game_version VARCHAR(16),
        date_of_completion TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE race_game_party_records (
        id SERIAL PRIMARY KEY,
        game_record_id INT REFERENCES race_game_records(id) ON DELETE CASCADE,
        party_name VARCHAR(128) NOT NULL,
        duration_to_wipe INTERVAL,
        duration_to_escape INTERVAL,
        is_winner BOOLEAN DEFAULT FALSE
    );

    CREATE TABLE race_game_participants (
        id SERIAL PRIMARY KEY,
        party_id INT REFERENCES race_game_party_records(id) ON DELETE CASCADE,
        user_id UUID
    );

    CREATE TABLE race_game_character_records (
        id SERIAL PRIMARY KEY,
        party_id INT REFERENCES race_game_party_records(id) ON DELETE CASCADE,
        character_name VARCHAR(128) NOT NULL,
        level INT,
        combatant_class VARCHAR(32),
        id_of_controlling_user UUID
    );
    `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE race_game_character_records;
    DROP TABLE race_game_participants;
    DROP TABLE race_game_party_records;
    DROP TABLE race_game_records;
    `);
};

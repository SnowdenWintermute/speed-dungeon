exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TYPE combatant_class as ENUM ('warrior', 'rogue', 'mage');

    CREATE TABLE race_game_records (
        id SERIAL PRIMARY KEY,
        game_name VARCHAR(128) NOT NULL,
        game_version VARCHAR(16),
        time_of_completion TIMESTAMP WITH TIME ZONE
    );

    CREATE TABLE race_game_party_records (
        id SERIAL PRIMARY KEY,
        game_record_id INT REFERENCES race_game_records(id) ON DELETE CASCADE,
        party_name VARCHAR(128) NOT NULL,
        duration_to_wipe INTERVAL,
        duration_to_escape INTERVAL,
        is_winner BOOLEAN DEFAULT FALSE
    );

    CREATE TABLE race_game_participant_records (
        id SERIAL PRIMARY KEY,
        party_id INT REFERENCES race_game_party_records(id) ON DELETE CASCADE,
        user_id INT,
        UNIQUE (party_id, user_id)
    );

    CREATE TABLE race_game_character_records (
        id UUID PRIMARY KEY,
        party_id INT REFERENCES race_game_party_records(id) ON DELETE CASCADE,
        character_name VARCHAR(128) NOT NULL,
        level INT,
        combatant_class combatant_class NOT NULL,
        id_of_controlling_user INT
    );


    CREATE INDEX idx_party_records_game_record_id ON race_game_party_records (game_record_id);
    CREATE INDEX idx_participant_records_party_id ON race_game_participant_records (party_id);
    CREATE INDEX idx_character_records_party_id ON race_game_character_records (party_id);
    `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE race_game_character_records;
    DROP TABLE race_game_participant_records;
    DROP TABLE race_game_party_records;
    DROP TABLE race_game_records;
    `);
};


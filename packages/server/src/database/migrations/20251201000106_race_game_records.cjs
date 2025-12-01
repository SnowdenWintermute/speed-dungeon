exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TYPE combatant_class as ENUM ('warrior', 'rogue', 'mage');
    CREATE TYPE party_fate as ENUM ('wipe', 'escape');

    CREATE TABLE race_game_records (
        id UUID PRIMARY KEY,
        game_name VARCHAR(128) NOT NULL,
        game_version VARCHAR(16),
        time_started TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        time_of_completion TIMESTAMP WITH TIME ZONE
    );

    CREATE TABLE race_game_party_records (
        id UUID PRIMARY KEY,
        game_id UUID REFERENCES race_game_records(id) ON DELETE CASCADE,
        party_name VARCHAR(128) NOT NULL,
        party_fate party_fate,
        party_fate_recorded_at TIMESTAMP WITH TIME ZONE,
        is_winner BOOLEAN DEFAULT FALSE,
        deepest_floor INT DEFAULT 1
    );

    CREATE TABLE race_game_participant_records (
        id SERIAL PRIMARY KEY,
        party_id UUID REFERENCES race_game_party_records(id) ON DELETE CASCADE,
        user_id INT,
        UNIQUE (party_id, user_id)
    );

    CREATE TABLE race_game_character_records (
        id UUID PRIMARY KEY,
        party_id UUID REFERENCES race_game_party_records(id) ON DELETE CASCADE,
        character_name VARCHAR(128) NOT NULL,
        level INT,
        combatant_class combatant_class NOT NULL,
        id_of_controlling_user INT
    );


    CREATE INDEX idx_party_records_game_id ON race_game_party_records (game_id);
    CREATE INDEX idx_participant_user_id ON race_game_participant_records (user_id);
    CREATE INDEX idx_participant_records_party_id ON race_game_participant_records (party_id);
    CREATE INDEX idx_character_records_party_id ON race_game_character_records (party_id);
    CREATE INDEX idx_race_game_records_time_started ON race_game_records (time_started);
    CREATE INDEX idx_party_records_game_id_is_winner ON race_game_party_records (game_id, is_winner);
    CREATE INDEX idx_participant_user_id_party_id ON race_game_participant_records (user_id, party_id);  
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE race_game_character_records;
    DROP TABLE race_game_participant_records;
    DROP TABLE race_game_party_records;
    DROP TABLE race_game_records;
    DROP TYPE combatant_class;
    DROP TYPE party_fate;
    `);
};


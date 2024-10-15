exports.shorthands = undefined;

const resourceType="TABLE"
const resourceName="character_slots"

exports.up = (pgm) => {
  pgm.sql(`
    CREATE ${resourceType} ${resourceName} (
        id SERIAL PRIMARY KEY,
        profile_id INTEGER REFERENCES speed_dungeon_profiles(id) ON DELETE CASCADE,
        slot_number INTEGER NOT NULL,
        character_id UUID REFERENCES player_characters(id) ON DELETE SET NULL,
        UNIQUE (profile_id, slot_number)
    );
    `);
};

exports.down = (pgm) => {
  pgm.sql(`
        DROP ${resourceType} ${resourceName};
    `);
};


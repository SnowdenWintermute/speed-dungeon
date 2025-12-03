exports.shorthands = undefined;

const resourceType="TABLE"
const resourceName="speed_dungeon_profiles"

// owner_id refers to the snowauth user_id in the
// snowauth server database which is of type SERIAL

exports.up = (pgm) => {
  pgm.sql(`
    CREATE ${resourceType} ${resourceName} (
      id SERIAL PRIMARY KEY,
      owner_id INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      character_capacity INTEGER
    );
    `);
};

exports.down = (pgm) => {
  pgm.sql(`
        DROP ${resourceType} ${resourceName};
    `);
};


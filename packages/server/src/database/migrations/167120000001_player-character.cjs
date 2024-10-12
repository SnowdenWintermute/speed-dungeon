exports.shorthands = undefined;

const resourceType="TABLE"
const resourceName="player_characters"

// owner_id refers to the snowauth user_id in the
// snowauth server database which is of type SERIAL

exports.up = (pgm) => {
  pgm.sql(`
    CREATE ${resourceType} ${resourceName} (
      id UUID PRIMARY KEY,
      name VARCHAR(32) NOT NULL,
      owner_id INTEGER,
      game_version VARCHAR(16),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      combatant_properties JSONB NOT NULL
    );
    `);
};

exports.down = (pgm) => {
  pgm.sql(`
        DROP ${resourceType} ${resourceName};
    `);
};


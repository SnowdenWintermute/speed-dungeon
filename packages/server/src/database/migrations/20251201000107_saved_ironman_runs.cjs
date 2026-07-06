exports.shorthands = undefined;

const resourceType = "TABLE";
const resourceName = "saved_ironman_runs";

exports.up = (pgm) => {
  pgm.sql(`
    CREATE ${resourceType} ${resourceName} (
      id UUID PRIMARY KEY,
      schema_version VARCHAR(16),
      saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      game JSONB NOT NULL,
      user_ids_to_usernames JSONB NOT NULL
    );
    `);
};

exports.down = (pgm) => {
  pgm.sql(`
        DROP ${resourceType} ${resourceName};
    `);
};

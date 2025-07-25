import migrate from "node-pg-migrate";
import { pgOptions } from "./config.js";
import { pgPool } from "../singletons/pg-pool.js";

export async function runMigrations() {
  try {
    await pgPool.connect(pgOptions);
    // Run migrations using node-pg-migrate
    await migrate({
      databaseUrl: `postgresql://${pgOptions.user}:${pgOptions.password}@${pgOptions.host}:${pgOptions.port}/${pgOptions.database}`,
      direction: "up",
      migrationsTable: "pg_migrations",
      dir: "./src/database/migrations",
    });

    console.info("Migrations completed successfully");
  } catch (err) {
    //@ts-ignore
    if (err.code === "42P07")
      return console.info("Postgres tables already exist, no need to run migrations");
    console.error("Error running migrations", err);
    process.exit(1); // Exit the process with a failure status
  } finally {
    await pgPool.close();
  }
}

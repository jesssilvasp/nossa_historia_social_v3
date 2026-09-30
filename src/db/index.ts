import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

// Não lançar no import: o Next coleta dados das páginas durante o build,
// e nesse momento o DATABASE_URL pode ainda não existir no ambiente.
// As queries falham de forma controlada (fallbacks em session/data/bootstrap)
// e o erro real de conexão aparece nos logs em runtime.
if (!databaseUrl) {
  console.warn("DATABASE_URL is not set — usando placeholder; queries ao banco vão falhar até configurar a variável.");
}

const connectionString = databaseUrl ?? "postgresql://localhost:5432/build-placeholder";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);

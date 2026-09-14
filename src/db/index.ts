import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    // Supabase exige une connexion chiffrée. On refuse explicitement de se
    // connecter sans TLS plutôt que de dépendre du comportement par défaut
    // du pilote.
    ssl: { rejectUnauthorized: false },
    // Sur Netlify, chaque requête peut être servie par une fonction
    // "serverless" différente qui démarre et s'arrête rapidement. Avec le
    // "Transaction pooler" de Supabase (recommandé pour le serverless), la
    // bonne pratique officielle est de garder UNE seule connexion par
    // instance de fonction : c'est le pooler côté Supabase qui absorbe la
    // montée en charge, pas notre pool applicatif. Un pool plus large ici
    // n'aiderait pas et risquerait plutôt de saturer les connexions
    // disponibles si beaucoup de fonctions tournent en même temps.
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);

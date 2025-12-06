import { neon } from "@neondatabase/serverless";

export interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
  ENVIRONMENT: string;
}

export function getDb(env: Env) {
  return neon(env.DATABASE_URL);
}

export async function query<T = any>(
  env: Env,
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const db = getDb(env);
  return db(sql, params) as Promise<T[]>;
}

export async function queryOne<T = any>(
  env: Env,
  sql: string,
  params: any[] = []
): Promise<T | null> {
  const results = await query<T>(env, sql, params);
  return results[0] || null;
}

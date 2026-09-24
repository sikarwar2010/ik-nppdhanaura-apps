/**
 * Production-safe recovery for failed migration:
 *   20260916140000_survey_property_type
 *
 * Original failure (commit 1473cb6): ALTER TABLE "Survey" ...
 * Postgres error 42P01: relation "Survey" does not exist
 * (real table is @@map("survey") → "survey")
 *
 * That ALTER is a single statement — when it fails, no column is added.
 *
 * Safe for every API start:
 *   - No _prisma_migrations table (fresh DB) → no-op (exit 0); migrate deploy creates it
 *   - No failed row            → no-op (exit 0)
 *   - Failed + column missing  → migrate resolve --rolled-back (Case A)
 *   - Failed + column TEXT NULL → migrate resolve --applied (Case B)
 *   - Failed + unexpected schema / bad on-disk SQL → exit 1 (do not resolve)
 *
 * Does NOT run migrate deploy — the container CMD does that after this script.
 *
 * Never: migrate reset, DROP TABLE, DELETE FROM survey, skip migrations,
 *        DELETE FROM _prisma_migrations, resolve without schema checks.
 *
 * Usage (inside API container, cwd=/app):
 *   node scripts/resolve-failed-survey-property-type-migration.mjs
 */
import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { Client } from "pg"

const MIG = "20260916140000_survey_property_type"
const SCHEMA = process.env.PRISMA_SCHEMA ?? "prisma/schema.prisma"
const MIGRATION_SQL_PATH =
  process.env.MIGRATION_SQL_PATH ??
  join("prisma", "migrations", MIG, "migration.sql")

function runPrisma(args) {
  const prismaBin = "./node_modules/.bin/prisma"
  const result = spawnSync(prismaBin, [...args, `--schema=${SCHEMA}`], {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function assertCorrectMigrationSql() {
  let sql
  try {
    sql = readFileSync(MIGRATION_SQL_PATH, "utf8")
  } catch (err) {
    throw new Error(
      `Cannot read ${MIGRATION_SQL_PATH}: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  // Case-sensitive: quoted "Survey" is the original production bug.
  // Do not use \b after the closing quote — " is non-word, so \b never matches.
  const hasWrongSurvey = /ALTER\s+TABLE\s+"Survey"/.test(sql)
  const hasSurveyLower = /ALTER\s+TABLE\s+"survey"/.test(sql)

  if (hasWrongSurvey) {
    throw new Error(
      `On-disk ${MIGRATION_SQL_PATH} still uses ALTER TABLE "Survey". ` +
      `Redeploy an image with the corrected SQL before resolving.`
    )
  }
  if (!hasSurveyLower) {
    throw new Error(
      `On-disk ${MIGRATION_SQL_PATH} does not contain ALTER TABLE "survey". Refusing to resolve.`
    )
  }
  console.log(`[recovery] migration_sql_ok=true path=${MIGRATION_SQL_PATH}`)
}

/**
 * @param {import("pg").Client} client
 */
async function prismaMigrationsTableExists(client) {
  const res = await client.query(
    `SELECT 1
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name = '_prisma_migrations'
     LIMIT 1`
  )
  return (res.rowCount ?? 0) > 0
}

/**
 * @param {import("pg").Client} client
 */
async function getFailedMigration(client) {
  const res = await client.query(
    `SELECT migration_name, started_at, finished_at, rolled_back_at,
            applied_steps_count, LEFT(COALESCE(logs, ''), 500) AS logs
     FROM "_prisma_migrations"
     WHERE migration_name = $1
     ORDER BY started_at DESC
     LIMIT 1`,
    [MIG]
  )
  return res.rows[0] ?? null
}

/**
 * @param {import("pg").Client} client
 */
async function getPropertyTypeColumn(client) {
  const res = await client.query(
    `SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'survey'
       AND column_name = 'propertyType'
     LIMIT 1`
  )
  return res.rows[0] ?? null
}

/**
 * @param {import("pg").Client} client
 */
async function hasPascalSurveyTable(client) {
  const res = await client.query(
    `SELECT 1
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name = 'Survey'
     LIMIT 1`
  )
  return (res.rowCount ?? 0) > 0
}

async function main() {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    throw new Error("DATABASE_URL is required")
  }

  console.log(`[recovery] Checking failed migration state for ${MIG}...`)
  assertCorrectMigrationSql()

  const client = new Client({ connectionString: url })
  await client.connect()

  try {
    const migrationsTableOk = await prismaMigrationsTableExists(client)
    if (!migrationsTableOk) {
      console.log(
        `[recovery] recovery_skipped=no_migrations_table migration=${MIG}`
      )
      return
    }

    const row = await getFailedMigration(client)
    if (!row) {
      console.log(`[recovery] recovery_skipped=not_present migration=${MIG}`)
      return
    }

    const finished = row.finished_at != null
    const rolledBack = row.rolled_back_at != null
    console.log(
      `[recovery] migration_row finished=${finished} rolled_back=${rolledBack} ` +
      `started_at=${row.started_at?.toISOString?.() ?? row.started_at} ` +
      `applied_steps_count=${row.applied_steps_count}`
    )
    if (row.logs) {
      console.log(`[recovery] logs_preview=${JSON.stringify(row.logs)}`)
    }

    // Failed = started but neither finished nor rolled back.
    if (finished || rolledBack) {
      console.log(`[recovery] recovery_skipped=not_failed migration=${MIG}`)
      return
    }

    if (await hasPascalSurveyTable(client)) {
      throw new Error(
        `Unexpected public."Survey" table exists alongside failed ${MIG}. ` +
        `Refusing to auto-resolve; inspect schema manually.`
      )
    }

    const col = await getPropertyTypeColumn(client)
    if (!col) {
      console.log(
        `[recovery] case=A propertyType_exists=false → migrate resolve --rolled-back`
      )
      runPrisma(["migrate", "resolve", "--rolled-back", MIG])
      console.log(`[recovery] resolve_complete=rolled-back migration=${MIG}`)
      return
    }

    const typeOk =
      col.data_type === "text" || col.data_type === "character varying"
    const nullableOk = col.is_nullable === "YES"
    console.log(
      `[recovery] propertyType data_type=${col.data_type} is_nullable=${col.is_nullable} ` +
      `column_default=${col.column_default ?? "null"}`
    )

    if (!typeOk || !nullableOk) {
      throw new Error(
        `Unexpected survey."propertyType" shape (type=${col.data_type}, ` +
        `nullable=${col.is_nullable}). Refusing to auto-resolve.`
      )
    }

    console.log(
      `[recovery] case=B propertyType_exists=true → migrate resolve --applied`
    )
    runPrisma(["migrate", "resolve", "--applied", MIG])
    console.log(`[recovery] resolve_complete=applied migration=${MIG}`)
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(
    `[recovery] FAILED: ${err instanceof Error ? err.message : String(err)}`
  )
  process.exit(1)
})

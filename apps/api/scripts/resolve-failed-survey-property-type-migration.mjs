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
 * Decision (verified against live schema, not assumed):
 *   - propertyType MISSING  → migrate resolve --rolled-back, then migrate deploy
 *   - propertyType PRESENT  → migrate resolve --applied, then migrate deploy
 *
 * Never: migrate reset, DROP TABLE, DELETE FROM survey, skip migrations.
 *
 * Usage (inside API container, cwd=/app):
 *   node scripts/resolve-failed-survey-property-type-migration.mjs
 */
import { spawnSync } from "node:child_process"
import { Client } from "pg"

const MIG = "20260916140000_survey_property_type"
const SCHEMA = process.env.PRISMA_SCHEMA ?? "prisma/schema.prisma"

function runPrisma(args) {
  const result = spawnSync("npx", ["prisma", ...args, `--schema=${SCHEMA}`], {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

async function propertyTypeExists() {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    throw new Error("DATABASE_URL is required")
  }
  const client = new Client({ connectionString: url })
  await client.connect()
  try {
    const res = await client.query(
      `SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'survey'
         AND column_name = 'propertyType'
       LIMIT 1`
    )
    return res.rowCount > 0
  } finally {
    await client.end()
  }
}

async function main() {
  console.log(`Checking public.survey."propertyType" before resolving ${MIG}...`)
  const exists = await propertyTypeExists()
  console.log(`propertyType_exists=${exists}`)

  if (!exists) {
    console.log(
      "Column missing → original ALTER never applied. Marking rolled back, then deploy."
    )
    runPrisma(["migrate", "resolve", "--rolled-back", MIG])
  } else {
    console.log(
      "Column already present → schema matches intent. Marking applied, then deploy."
    )
    runPrisma(["migrate", "resolve", "--applied", MIG])
  }

  runPrisma(["migrate", "deploy"])
  runPrisma(["migrate", "status"])
  console.log("Recovery complete.")
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})

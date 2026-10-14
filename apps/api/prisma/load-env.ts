import { config as loadDotenv } from "dotenv"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const repoRoot = path.resolve(apiRoot, "..")

function loadIfPresent(envPath: string) {
  if (!fs.existsSync(envPath)) return
  loadDotenv({ path: envPath, override: false, quiet: true })
}

// Process environment wins. Then apps/api/.env, then repo-root .env for any
// keys still unset. Missing files are skipped.
loadIfPresent(path.join(apiRoot, ".env"))
loadIfPresent(path.join(repoRoot, ".env"))

if (!process.env.DATABASE_URL?.trim()) {
  throw new Error(
    "DATABASE_URL is not set. Prisma reads it from the process environment, then apps/api/.env, then the repo root .env. Copy apps/api/.env.example to apps/api/.env (pnpm dev:ensure-env) or export DATABASE_URL. The root .env.example does not define DATABASE_URL."
  )
}

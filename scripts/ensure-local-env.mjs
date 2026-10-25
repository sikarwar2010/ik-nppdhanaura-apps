/**
 * Local-dev only: ensure package `.env` files exist (copy from `.env.example`
 * when missing) and soft-check Postgres/Redis ports used by host turbo.
 *
 * Does not overwrite existing `.env` files. Production is unaffected.
 */
import fs from "node:fs"
import net from "node:net"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const requireInfra = process.argv.includes("--require-infra")

const ENV_TARGETS = [
  { env: ".env", example: ".env.example" },
  { env: "apps/api/.env", example: "apps/api/.env.example" },
  { env: "apps/portal/.env", example: "apps/portal/.env.example" },
  { env: "apps/web/.env", example: "apps/web/.env.example" },
]

const INFRA = [
  { port: 5433, label: "Postgres", hint: "docker compose up -d" },
  { port: 6380, label: "Redis", hint: "docker compose up -d" },
]

function canConnect(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host })
    socket.setTimeout(500)
    socket.once("connect", () => {
      socket.destroy()
      resolve(true)
    })
    socket.once("timeout", () => {
      socket.destroy()
      resolve(false)
    })
    socket.once("error", () => {
      socket.destroy()
      resolve(false)
    })
  })
}

let created = 0
for (const { env, example } of ENV_TARGETS) {
  const envPath = path.join(root, env)
  const examplePath = path.join(root, example)

  if (fs.existsSync(envPath)) continue

  if (!fs.existsSync(examplePath)) {
    console.error(`Missing ${example} — cannot create ${env}`)
    process.exit(1)
  }

  fs.copyFileSync(examplePath, envPath)
  console.log(`Created ${env} from ${example}`)
  created += 1
}

if (created === 0) {
  console.log("Local .env files already present.")
} else {
  console.log(`Created ${created} local .env file(s). They are gitignored — do not commit them.`)
}

const missingInfra = []
for (const { port, label } of INFRA) {
  if (!(await canConnect(port))) {
    missingInfra.push(`  ${label} on 127.0.0.1:${port}`)
  }
}

if (missingInfra.length > 0) {
  const report = requireInfra ? console.error : console.warn
  report("")
  report("Local infra ports are not reachable:")
  report(missingInfra.join("\n"))
  report("")
  report("Start infra only (Postgres 127.0.0.1:5433, Redis 127.0.0.1:6380):")
  report("  pnpm docker:up")
  report("  # or: docker compose up -d")
  report("Docker Desktop must be running. Confirm Redis with:")
  report("  Test-NetConnection 127.0.0.1 -Port 6380")
  report("")
  if (requireInfra) {
    report(
      "Refusing to start because Postgres (127.0.0.1:5433) or Redis (127.0.0.1:6380) is not reachable."
    )
    process.exit(1)
  }
  report("Continuing — Nest will fail later if DATABASE_URL / REDIS_URL cannot connect.")
}

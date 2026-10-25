import { readFileSync } from "node:fs"
import path from "node:path"

describe("dev task configuration", () => {
  const root = path.resolve(__dirname, "../../../..")

  it("keeps dev persistent, uncached, and dependent on upstream builds", () => {
    const turbo = JSON.parse(readFileSync(path.join(root, "turbo.json"), "utf8")) as {
      tasks: {
        dev: { cache?: boolean; persistent?: boolean; dependsOn?: string[] }
      }
    }
    expect(turbo.tasks.dev).toMatchObject({
      cache: false,
      persistent: true,
      dependsOn: ["^build"],
    })
  })

  it("keeps shared package build and dev scripts separate", () => {
    for (const name of ["types", "api-client"]) {
      const pkg = JSON.parse(
        readFileSync(path.join(root, "packages", name, "package.json"), "utf8")
      ) as { scripts: { build: string; dev: string } }
      expect(pkg.scripts.build).toBe("tsc")
      expect(pkg.scripts.dev).toBe("tsc --watch --preserveWatchOutput")
      expect(pkg.scripts.build).not.toBe(pkg.scripts.dev)
    }
  })
})

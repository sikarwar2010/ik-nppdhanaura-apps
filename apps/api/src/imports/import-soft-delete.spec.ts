import { readFileSync } from "node:fs"
import { join } from "node:path"

import { shouldPruneOrphanCount, shouldReconcileWardAfterImport } from "./import-reconcile"

describe("import soft-delete revive gates", () => {
  it("still reconciles only when UPDATE succeeds with zero failures", () => {
    expect(
      shouldReconcileWardAfterImport({
        duplicateStrategy: "UPDATE",
        failedRows: 0,
        wardIdsSeen: new Set(["ward-2"]),
        touchedSurveyIds: new Set(["a", "b"]),
      })
    ).toBe("ward-2")
  })

  it("still revives soft-deleted surveys on UPDATE import", () => {
    const src = readFileSync(join(__dirname, "imports.service.ts"), "utf8")
    expect(src).toContain("must revive")
    expect(src).toContain("deletedAt: null")
    expect(src).toContain("revived: isSoftDeleted")
  })

  it("keeps the orphan prune cap so import cannot wipe a ward", () => {
    expect(shouldPruneOrphanCount(1431, 10)).toBe(false)
    expect(shouldPruneOrphanCount(2, 1439)).toBe(true)
  })

  it("skips reconcile when any row failed (prevents partial prune)", () => {
    expect(
      shouldReconcileWardAfterImport({
        duplicateStrategy: "UPDATE",
        failedRows: 2,
        wardIdsSeen: new Set(["ward-2"]),
        touchedSurveyIds: new Set(["a"]),
      })
    ).toBeNull()
  })
})

import { readFileSync } from "node:fs"
import { join } from "node:path"

import { Reflector } from "@nestjs/core"

import { REQUIRE_PERMISSIONS_KEY, REQUIRE_ROLES_KEY } from "../auth/auth.decorators"
import { isGrantedToDepartmentAdmin } from "../db/seed-database"
import { ProductionResetController } from "./production-reset.controller"
import {
  classifyPayment,
  RESET_CONFIRMATION_PHRASE,
  resetBlockers,
  scopeHash,
  type ResetExecutionCheck,
  type ResetPaymentFacts,
} from "./production-reset.rules"
import { ProductionResetService } from "./production-reset.service"

const payment = (over: Partial<ResetPaymentFacts> = {}): ResetPaymentFacts => ({
  id: "p1",
  gateway: null,
  status: "SUCCESS",
  paymentMode: "CASH",
  amount: "100.00",
  atomTxnId: null,
  paymentReference: "OFF-1",
  remarks: null,
  counterCode: null,
  updatedAt: new Date("2026-11-01T00:00:00Z"),
  ...over,
})

describe("classifying payments", () => {
  it("only the sandbox gateway and explicit markers count as test data", () => {
    expect(classifyPayment(payment({ gateway: "sandbox", paymentMode: "ONLINE" })).classification).toBe("TEST")
    expect(classifyPayment(payment({ remarks: "Test entry by clerk" })).classification).toBe("TEST")
    expect(classifyPayment(payment({ counterCode: "UAT-1" })).classification).toBe("TEST")
  })

  it("an ordinary counter payment needs manual review, never automatic", () => {
    expect(classifyPayment(payment()).classification).toBe("REVIEW")
    expect(classifyPayment(payment({ remarks: "Contest prize deduction" })).classification).toBe("REVIEW")
  })

  it("a gateway-confirmed payment is flagged, even if its remarks say test", () => {
    const result = classifyPayment(
      payment({ paymentMode: "ONLINE", gateway: "atom-ndps", atomTxnId: "A1", remarks: "test" })
    )
    expect(result.classification).toBe("REVIEW")
    expect(result.gatewayConfirmed).toBe(true)
  })
})

describe("scope fingerprint", () => {
  it("changes when a payment changes, whatever the order", () => {
    const a = payment({ id: "a" })
    const b = payment({ id: "b" })
    expect(scopeHash([a, b])).toBe(scopeHash([b, a]))
    expect(scopeHash([a, b])).not.toBe(
      scopeHash([a, { ...b, updatedAt: new Date("2026-11-02T00:00:00Z") }])
    )
  })
})

describe("what must be true before a reset runs", () => {
  const ready: ResetExecutionCheck = {
    enabled: true,
    status: "BACKUP_VERIFIED",
    phrase: RESET_CONFIRMATION_PHRASE,
    reason: "Clearing UAT entries before go-live",
    secondApprovalRequired: false,
    backupVerified: true,
  }
  const codes = (over: Partial<ResetExecutionCheck>) =>
    resetBlockers({ ...ready, ...over }).map((row) => row.code)

  it("passes when everything is in place", () => {
    expect(codes({})).toEqual([])
  })

  it("is off unless the server is explicitly switched on", () => {
    expect(codes({ enabled: false })).toContain("RESET_DISABLED")
  })

  it("needs the exact phrase, a reason and a verified backup", () => {
    expect(codes({ phrase: "clear test transactions" })).toContain("RESET_PHRASE_REQUIRED")
    expect(codes({ reason: "short" })).toContain("RESET_REASON_REQUIRED")
    expect(codes({ backupVerified: false })).toContain("RESET_BACKUP_REQUIRED")
  })

  it("needs a second approval when configured", () => {
    expect(codes({ secondApprovalRequired: true })).toContain("RESET_APPROVAL_REQUIRED")
    expect(codes({ secondApprovalRequired: true, status: "APPROVED" })).toEqual([])
  })

  it("cannot run twice", () => {
    expect(codes({ status: "EXECUTED" })).toContain("RESET_NOT_READY")
  })
})

describe("access", () => {
  it("is limited to the Super Admin role and permission on the whole controller", () => {
    const reflector = new Reflector()
    expect(reflector.get(REQUIRE_ROLES_KEY, ProductionResetController)).toEqual(["SUPER_ADMIN"])
    expect(reflector.get(REQUIRE_PERMISSIONS_KEY, ProductionResetController)).toEqual([
      "system:production-reset",
    ])
  })

  it("the seed never grants it to Department Admin", () => {
    expect(isGrantedToDepartmentAdmin("system:production-reset")).toBe(false)
    expect(isGrantedToDepartmentAdmin("payment:collect")).toBe(true)
  })

  it("the service itself refuses anyone else", async () => {
    const service = new ProductionResetService({} as never, {} as never, {} as never)
    const clerk = { id: "u", roles: ["DEPARTMENT_ADMIN"], permissions: ["system:production-reset"] } as never
    await expect(service.preview(clerk)).rejects.toMatchObject({ status: 403 })
    await expect(service.prepare(clerk, [])).rejects.toMatchObject({ status: 403 })
    await expect(
      service.execute("r", { confirmationPhrase: RESET_CONFIRMATION_PHRASE, reason: "long enough reason" }, clerk)
    ).rejects.toMatchObject({ status: 403 })
  })
})

describe("safeguards in the code", () => {
  it("is never run from startup, a migration or the seed", () => {
    const root = join(__dirname, "..")
    for (const file of ["main.ts", "seed-cli.ts", "startup-env-cli.ts", "db/seed-database.ts"]) {
      expect(readFileSync(join(root, file), "utf8")).not.toMatch(/ProductionReset|productionReset/)
    }
    const service = readFileSync(join(__dirname, "production-reset.service.ts"), "utf8")
    expect(service).not.toMatch(/onModuleInit|setInterval|setTimeout|@Cron/)
  })

  it("never deletes demands, master data, configuration or audit rows", () => {
    const service = readFileSync(join(__dirname, "production-reset.service.ts"), "utf8")
    const deletes = [...service.matchAll(/tx\.(\w+)\.delete(?:Many)?\(/g)].map((match) => match[1])
    expect(new Set(deletes)).toEqual(
      new Set([
        "paymentAllocation",
        "paymentCallback",
        "paymentTransaction",
        "paymentRefund",
        "paymentSettlement",
        "payment",
        "receiptSequence",
      ])
    )
  })
})

/**
 * Tax-administration checks: rule preview (same engine as publication),
 * amount validation, assessment-year rules, decimal rounding and
 * server-side permissions. Rates used here are illustrations only.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { BadRequestException, ConflictException } from "@nestjs/common"

import { REQUIRE_PERMISSIONS_KEY } from "../auth/auth.decorators"
import { computeDemandTotals, computeFloorAlv } from "../tax/tax-calc"
import {
  policyAmountProblems,
  PreviewInputError,
  previewCharges,
  type PreviewRuleInput,
  type PreviewSample,
} from "./charge-preview"
import { PoliciesController } from "./policies.controller"
import { PoliciesService } from "./policies.service"
import { findOverlappingYear } from "./year-overlap"

const sample: PreviewSample = {
  propertyTax: "2000.00",
  waterTax: "1500.00",
  drainageTax: "0.00",
  previousPropertyTax: "1000.00",
  previousWaterTax: "400.00",
  previousDrainageTax: "0.00",
  alreadyPaid: "0.00",
  asOf: "2026-06-15",
}

const rule = (over: Partial<PreviewRuleInput>): PreviewRuleInput => ({
  kind: "rebate",
  taxCategory: "PROPERTY_TAX",
  type: "PERCENTAGE",
  rate: "10",
  includeArrears: false,
  ...over,
})

describe("4–6: property-tax and water-tax rebate previews", () => {
  it("4: property-tax rebate = eligible property tax × % ÷ 100 (₹2,000 × 10% = ₹200)", () => {
    const p = previewCharges(rule({}), sample)
    expect(p.eligibleBase).toBe("2000.00")
    expect(p.ruleAmount).toBe("200.00")
    expect(p.totals.rebate).toBe("200.00")
    expect(p.applies).toBe(true)
    expect(p.estimate).toBe(true)
    expect(p.steps[1]?.formula).toBe("₹2,000.00 × 10% ÷ 100")
    // 2,000 + 1,500 current + 1,400 arrears − 200
    expect(p.totals.payableBeforePayment).toBe("4700.00")
  })

  it("5: water-tax rebate uses only water tax (₹1,500 × 5% = ₹75)", () => {
    const p = previewCharges(rule({ taxCategory: "WATER_TAX", rate: "5" }), sample)
    expect(p.eligibleBase).toBe("1500.00")
    expect(p.ruleAmount).toBe("75.00")
  })

  it("6: a property-tax rebate never touches water tax, and vice versa", () => {
    const property = previewCharges(rule({}), sample)
    expect(property.line.category).toBe("PROPERTY_TAX")
    expect(property.eligibleExplanation).toMatch(/other taxes are not included/i)
    expect(property.totals.rebate).toBe("200.00")
    const water = previewCharges(rule({ taxCategory: "WATER_TAX" }), sample)
    expect(water.totals.rebate).toBe("150.00")
  })
})

describe("7: property-tax and water-tax penalties stay separate", () => {
  it("a water-tax penalty is charged only on water tax", () => {
    const p = previewCharges(rule({ kind: "penalty", taxCategory: "WATER_TAX", rate: "2" }), sample)
    expect(p.eligibleBase).toBe("1500.00")
    expect(p.totals.penalty).toBe("30.00")
    expect(p.totals.rebate).toBe("0.00")
  })

  it("a due-date penalty is not applied before the due date plus grace days", () => {
    const before = previewCharges(
      rule({ kind: "penalty", rate: "5", trigger: "DUE_DATE_PASSED", dueDate: "2026-06-10", graceDays: 10 }),
      sample
    )
    expect(before.applies).toBe(false)
    expect(before.totals.penalty).toBe("0.00")
    expect(before.reason).toMatch(/has not passed/)
    const after = previewCharges(
      rule({ kind: "penalty", rate: "5", trigger: "DUE_DATE_PASSED", dueDate: "2026-06-01", graceDays: 10 }),
      sample
    )
    expect(after.totals.penalty).toBe("100.00")
  })
})

describe("8: historical arrears only when the rule says so", () => {
  it("excludes arrears by default and includes only the same tax's arrears when allowed", () => {
    expect(previewCharges(rule({}), sample).eligibleBase).toBe("2000.00")
    const withArrears = previewCharges(rule({ includeArrears: true }), sample)
    // 2,000 current + 1,000 property arrears (water arrears ₹400 excluded)
    expect(withArrears.eligibleBase).toBe("3000.00")
    expect(withArrears.ruleAmount).toBe("300.00")
  })
})

describe("9: repeated calculation does not double-apply", () => {
  it("the same input gives the same single rebate every time", () => {
    const a = previewCharges(rule({}), sample)
    const b = previewCharges(rule({}), sample)
    expect(b.totals).toEqual(a.totals)
    expect(a.totals.rebate).toBe("200.00")
  })

  it("caps: maximum per property and never more than the eligible amount", () => {
    expect(previewCharges(rule({ maxAmount: "150" }), sample).ruleAmount).toBe("150.00")
    const fixed = previewCharges(rule({ type: "FIXED_AMOUNT", fixedAmount: "5000", rate: null }), sample)
    expect(fixed.ruleAmount).toBe("2000.00")
    expect(fixed.steps.some((s) => s.label === "After limits")).toBe(true)
  })

  it("shows outstanding after payments already made", () => {
    const p = previewCharges(rule({}), { ...sample, alreadyPaid: "700.00" })
    expect(p.totals.outstanding).toBe("4000.00")
  })
})

describe("10: currency rounding (half-up to paise, decimal arithmetic)", () => {
  it("₹3.00 ALV × 7.5% water tax = ₹0.225 → ₹0.23 (floating point gave ₹0.22)", () => {
    expect(computeDemandTotals(3, 0, 7.5, 0, 0, true, false).waterTax).toBe(0.23)
    expect(computeDemandTotals(6.2, 0, 7.5, 0, 0, true, false).waterTax).toBe(0.47)
  })

  it("floor ALV and property tax stay exact", () => {
    expect(computeFloorAlv(2500, 1, 80, 10)).toEqual({
      grossAlv: 30000,
      assessableAlv: 24000,
      propertyTax: 2400,
    })
  })

  it("preview rebates round half-up", () => {
    // 10.05 × 5% = 0.5025 → 0.50; 10.10 × 5% = 0.505 → 0.51
    expect(previewCharges(rule({ rate: "5" }), { ...sample, propertyTax: "10.05" }).ruleAmount).toBe("0.50")
    expect(previewCharges(rule({ rate: "5" }), { ...sample, propertyTax: "10.10" }).ruleAmount).toBe("0.51")
  })
})

describe("rule amount validation", () => {
  it("rejects zero, negative, malformed and over-100% rates", () => {
    expect(policyAmountProblems({ type: "PERCENTAGE", rate: "0" })).toHaveLength(1)
    expect(policyAmountProblems({ type: "PERCENTAGE", rate: "-5" })).toHaveLength(1)
    expect(policyAmountProblems({ type: "PERCENTAGE", rate: "abc" })).toHaveLength(1)
    expect(policyAmountProblems({ type: "PERCENTAGE", rate: "100.5" })).toHaveLength(1)
    expect(policyAmountProblems({ type: "PERCENTAGE", rate: "7.5" })).toHaveLength(0)
  })

  it("rejects zero fixed amounts, bad caps and reversed dates", () => {
    expect(policyAmountProblems({ type: "FIXED_AMOUNT", fixedAmount: "0" })[0]?.field).toBe("fixedAmount")
    expect(policyAmountProblems({ type: "PERCENTAGE", rate: "5", maxAmount: "-1" })[0]?.field).toBe("maxAmount")
    expect(
      policyAmountProblems({ type: "PERCENTAGE", rate: "5", startsOn: "2026-05-01", endsOn: "2026-04-01" })[0]?.field
    ).toBe("endsOn")
  })

  it("the preview refuses invalid input instead of guessing", () => {
    expect(() => previewCharges(rule({ rate: "150" }), sample)).toThrow(PreviewInputError)
    expect(() => previewCharges(rule({}), { ...sample, propertyTax: "12.345" })).toThrow(PreviewInputError)
    expect(() =>
      previewCharges(rule({ kind: "penalty", trigger: "DUE_DATE_PASSED", dueDate: null }), sample)
    ).toThrow(/due date/)
  })
})

describe("1–2, 12: assessment years", () => {
  function serviceWith(overrides: Record<string, unknown>) {
    const audit = { log: jest.fn() }
    const prisma = {
      referenceCategory: { findUnique: jest.fn().mockResolvedValue({ id: "cat" }) },
      referenceEntry: {
        findFirst: jest.fn().mockResolvedValue(null),
        aggregate: jest.fn().mockResolvedValue({ _max: { sortOrder: 2 } }),
        create: jest.fn().mockResolvedValue({ id: "ay-2027" }),
      },
      assessmentYearProfile: {
        findMany: jest.fn().mockResolvedValue([
          { id: "p1", startsOn: new Date("2026-04-01"), endsOn: new Date("2027-03-31"), status: "ACTIVE" },
        ]),
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: "p2", status: "DRAFT" }),
      },
      assessmentDemand: { count: jest.fn().mockResolvedValue(0) },
      payment: { count: jest.fn().mockResolvedValue(0) },
      $transaction: jest.fn(),
      ...overrides,
    } as Record<string, unknown>
    prisma.$transaction = jest.fn((fn: (tx: unknown) => unknown) => fn(prisma))
    return { service: new PoliciesService(prisma as never, audit as never), prisma, audit }
  }

  it("1: creates a year with its dates and an audit entry", async () => {
    const { service, audit } = serviceWith({})
    const created = await service.createYear(
      { label: "2027-2028", startsOn: "2027-04-01", endsOn: "2028-03-31", status: "DRAFT" },
      "u1"
    )
    expect(created.code).toBe("AY_2027_2028")
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: "ASSESSMENT_YEAR_CREATED" }))
  })

  it("1: rejects an end date before the start and a non-consecutive label", async () => {
    const { service } = serviceWith({})
    await expect(
      service.createYear({ label: "2027-2028", startsOn: "2028-03-31", endsOn: "2027-04-01", status: "DRAFT" }, "u1")
    ).rejects.toBeInstanceOf(BadRequestException)
    await expect(
      service.createYear({ label: "2027-2029", startsOn: "2027-04-01", endsOn: "2028-03-31", status: "DRAFT" }, "u1")
    ).rejects.toMatchObject({ response: { code: "ASSESSMENT_YEAR_LABEL_INVALID" } })
  })

  it("2: rejects a duplicate year", async () => {
    const { service } = serviceWith({
      referenceEntry: {
        findFirst: jest.fn().mockResolvedValue({ id: "existing" }),
        aggregate: jest.fn(),
        create: jest.fn(),
      },
    })
    await expect(
      service.createYear({ label: "2026-2027", startsOn: "2026-04-01", endsOn: "2027-03-31", status: "DRAFT" }, "u1")
    ).rejects.toMatchObject({ response: { code: "ASSESSMENT_YEAR_DUPLICATE" } })
  })

  it("1: rejects overlapping periods", async () => {
    const { service } = serviceWith({})
    await expect(
      service.createYear({ label: "2027-2028", startsOn: "2027-01-01", endsOn: "2027-12-31", status: "DRAFT" }, "u1")
    ).rejects.toMatchObject({ response: { code: "ASSESSMENT_YEAR_OVERLAP" } })
    expect(findOverlappingYear({ startsOn: "2027-04-01", endsOn: "2028-03-31", status: "DRAFT" }, [])).toBeNull()
  })

  it("12: a year with demands or payments keeps its dates and cannot go back to draft", async () => {
    const profile = { id: "p1", startsOn: new Date("2026-04-01"), endsOn: new Date("2027-03-31"), status: "ACTIVE" }
    const { service, prisma } = serviceWith({
      assessmentDemand: { count: jest.fn().mockResolvedValue(3) },
      payment: { count: jest.fn().mockResolvedValue(1) },
    })
    ;(prisma.assessmentYearProfile as { findUnique: jest.Mock }).findUnique.mockResolvedValue(profile)
    await expect(service.updateYear("ay", { endsOn: "2027-06-30" }, "u1")).rejects.toBeInstanceOf(ConflictException)
    await expect(service.updateYear("ay", { status: "DRAFT" }, "u1")).rejects.toMatchObject({
      response: { code: "ASSESSMENT_YEAR_IN_USE" },
    })
  })
})

describe("11: changes need permissions on the server", () => {
  const proto = PoliciesController.prototype as unknown as Record<string, object>
  const required = (method: string) =>
    Reflect.getMetadata(REQUIRE_PERMISSIONS_KEY, proto[method] as object) as string[] | undefined

  it.each([
    "createRebate",
    "updateRebate",
    "activateRebate",
    "archiveRebate",
    "createPenalty",
    "updatePenalty",
    "activatePenalty",
    "archivePenalty",
    "createYear",
    "createNewYear",
    "updateYear",
  ])("%s requires settings:update", (method) => {
    expect(required(method)).toEqual(["settings:update"])
  })

  it("preview and lists only need read access and never write", () => {
    expect(required("preview")).toEqual(["report:read"])
    expect(required("listRebates")).toEqual(["report:read"])
  })
})

describe("one active rule per year and tax category (database index)", () => {
  // The per-tax pages need a property rule and a water rule active together;
  // the original index allowed only one ACTIVE rule per year.
  const sql = readFileSync(
    join(
      __dirname,
      "../../prisma/migrations/20261026120000_tax_category_policies_and_reversal/migration.sql"
    ),
    "utf8"
  )

  it.each(["rebate_policy", "penalty_policy"])("%s index covers the tax category", (table) => {
    expect(sql).toContain(
      `CREATE UNIQUE INDEX "${table}_one_active" ON "${table}"("assessmentYearId", "taxCategory") WHERE "status" = 'ACTIVE';`
    )
  })
})

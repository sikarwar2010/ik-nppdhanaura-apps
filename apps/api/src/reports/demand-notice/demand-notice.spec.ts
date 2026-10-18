import type { SurveyForDues } from "../../public-property-tax/dues.util"
import { calculateOutstanding } from "../../demands/outstanding"
import { generateDemandNoticeDocumentHtml } from "./demand-notice-html"
import { outstandingToNoticeLedger, duesPayloadToNoticeViewModel } from "./demand-notice-view-model"
import {
  compareParcelNatural,
  sortDemandNoticeSurveys,
} from "./demand-notice-sort"
import { chunkDemandNoticeSurveyIds } from "./demand-notice.constants"
import {
  partitionDemandNoticeValidation,
  validateSurveyForDemandNotice,
} from "./demand-notice.validation"

describe("chunkDemandNoticeSurveyIds", () => {
  it("splits 5000 ids into five chunks of 1000", () => {
    const ids = Array.from({ length: 5000 }, (_, i) => `id-${i}`)
    const chunks = chunkDemandNoticeSurveyIds(ids, 1000)
    expect(chunks).toHaveLength(5)
    expect(chunks.every((c) => c.length === 1000)).toBe(true)
    expect(chunks[0]?.[0]).toBe("id-0")
    expect(chunks[4]?.[999]).toBe("id-4999")
  })

  it("keeps a short list as a single chunk", () => {
    expect(chunkDemandNoticeSurveyIds(["a", "b"], 1000)).toEqual([["a", "b"]])
  })
})

function baseSurvey(
  overrides: Partial<SurveyForDues & { id: string }> = {}
): SurveyForDues & { id: string } {
  return {
    id: "cuid-1",
    surveyId: "chh-001-000001-001-R",
    ownerName: "Ram",
    ownerFatherName: "Shyam",
    mobile: "9876543210",
    propertyNo: "1",
    parcelNo: "10",
    houseNo: "3",
    streetName: null,
    locality: "Test",
    colony: null,
    city: "Chhata",
    pincode: null,
    propertyUse: "Residential",
    taxRateZone: "BELOW_9M",
    roadType: null,
    hasMunicipalWaterSupply: true,
    plotAreaSqFt: null,
    plinthAreaSqFt: null,
    totalBuiltUpAreaSqFt: null,
    ward: { number: 1, name: "Ward 1" },
    floors: [],
    ...overrides,
  }
}

describe("compareParcelNatural", () => {
  it("orders numeric parcels naturally", () => {
    expect(compareParcelNatural("2", "10")).toBeLessThan(0)
    expect(compareParcelNatural("10", "2")).toBeGreaterThan(0)
    expect(compareParcelNatural("10A", "10B")).toBeLessThan(0)
  })
})

describe("sortDemandNoticeSurveys", () => {
  it("sorts by ward then parcel then surveyId", () => {
    const sorted = sortDemandNoticeSurveys([
      {
        surveyId: "b",
        parcelNo: "10",
        ward: { number: 1 },
      },
      {
        surveyId: "a",
        parcelNo: "2",
        ward: { number: 1 },
      },
      {
        surveyId: "c",
        parcelNo: "1",
        ward: { number: 2 },
      },
    ])
    expect(sorted.map((s) => s.surveyId)).toEqual(["a", "b", "c"])
  })
})

describe("validateSurveyForDemandNotice", () => {
  it("rejects missing parcel and tax, but allows missing owner", () => {
    expect(
      validateSurveyForDemandNotice(
        baseSurvey({ ownerName: null }),
        { totalDemand: 100 },
        {
          hasPublishedTaxConfig: true,
        }
      )
    ).toBeNull()

    expect(
      validateSurveyForDemandNotice(
        baseSurvey({ parcelNo: "  " }),
        { totalDemand: 100 },
        {
          hasPublishedTaxConfig: true,
        }
      )
    ).toMatch(/parcel/i)

    expect(
      validateSurveyForDemandNotice(baseSurvey(), null, {
        hasPublishedTaxConfig: true,
      })
    ).toMatch(/tax/i)

    expect(
      validateSurveyForDemandNotice(
        baseSurvey(),
        { totalDemand: 10 },
        {
          hasPublishedTaxConfig: false,
        }
      )
    ).toMatch(/tax configuration/i)
  })

  it("accepts a complete survey", () => {
    expect(
      validateSurveyForDemandNotice(
        baseSurvey(),
        { totalDemand: 0 },
        {
          hasPublishedTaxConfig: true,
        }
      )
    ).toBeNull()
  })
})

describe("partitionDemandNoticeValidation", () => {
  it("never silently drops invalid rows", () => {
    const result = partitionDemandNoticeValidation([
      {
        survey: baseSurvey({ id: "ok", parcelNo: "1" }),
        tax: { totalDemand: 50 },
        hasPublishedTaxConfig: true,
      },
      {
        survey: baseSurvey({
          id: "bad",
          surveyId: "bad-id",
          parcelNo: null,
        }),
        tax: { totalDemand: 50 },
        hasPublishedTaxConfig: true,
      },
    ])
    expect(result.validIds).toEqual(["ok"])
    expect(result.invalid).toHaveLength(1)
    expect(result.invalid[0]?.surveyId).toBe("bad-id")
    expect(result.invalid[0]?.error).toMatch(/parcel/i)
  })
})

describe("duesPayloadToNoticeViewModel + HTML", () => {
  it("builds one page per notice with page-break CSS", () => {
    const dues = {
      id: "cuid-1",
      surveyId: "chh-001-000001-001-R",
      wardNumber: 1,
      wardName: "Ward 1",
      ownerName: "Ram",
      ownerFatherName: "Shyam",
      mobileMasked: "XXXXXX3210",
      propertyNo: "1",
      parcelNo: "10",
      houseNo: "3",
      streetName: null,
      locality: "Test",
      colony: null,
      city: "Chhata",
      pincode: null,
      propertyUse: "Residential Rented",
      taxRateZone: "BELOW_9M",
      roadType: null,
      assessmentYear: { id: "y1", code: "2025-26", name: "2025-2026" },
      taxConfig: { id: "cfg", version: 1 },
      floors: [
        {
          floorLabel: "Ground",
          usageType: "Residential",
          usageFactor: "1",
          construction: "RCC",
          areaSqFt: 100,
          rate: 0.36,
          alv: 345.6,
          tax: 34.56,
        },
      ],
      tax: {
        propertyTaxPct: 10,
        waterTaxPct: 7.5,
        drainageTaxPct: 2.5,
        penaltyPct: 0,
        assessablePct: 80,
        commercialAssessablePct: 80,
        propertyTax: 34.56,
        waterTax: 25.92,
        drainageTax: 8.64,
        penalty: 0,
        totalDemand: 69.12,
        annualBaseRate: 0.36,
        configFound: true,
      },
    }

    const vm = duesPayloadToNoticeViewModel(dues, {
      propertyType: "Residential",
    })
    expect(vm.surveyId).toBe(dues.surveyId)
    expect(vm.totalDemand).toBe(69.12)
    expect(vm.assessmentYear).toBe("2025-2026")
    expect(vm.ownerName).toBe("Ram")
    expect(vm.propertyType).toBe("Residential")

    const blankOwnerVm = duesPayloadToNoticeViewModel({
      ...dues,
      ownerName: null,
    })
    expect(blankOwnerVm.ownerName).toBe("N/A")

    const html = generateDemandNoticeDocumentHtml(
      [vm, { ...vm, surveyId: "second" }],
      {
        forPdf: true,
      }
    )
    expect(html).toContain("page-break-after: always")
    expect(html).toContain("संपत्ति कर मांग सूचना पत्र")
    expect(html).toContain("chh-001-000001-001-R")
    expect(html).toContain("www.nppdhanaura.in")
    expect(html).toContain(">Residential</div>")
    expect(html).not.toContain(">Residential Rented</div>")
    expect(html).toContain("second")
    expect(html.match(/class="page"/g)?.length).toBe(2)
    expect(html).not.toContain("Print A4 Notice")
  })

  it("J: notice financial lines match the ledger", () => {
    const breakdown = calculateOutstanding({
      selectedYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
      demands: [
        {
          id: "d-2024",
          assessmentYearId: "2024-2025",
          assessmentYearCode: "2024-2025",
          assessmentYearName: "2024-2025",
          propertyTax: "1000.00",
          waterTax: "0.00",
          drainageTax: "0.00",
          penalty: "0.00",
          interest: "0.00",
          currentYearDemand: "1000.00",
          credits: "0.00",
          debits: "0.00",
          payments: "750.00",
        },
      ],
      payments: [],
      calculatedCurrent: {
        propertyTax: "1500.00",
        waterTax: "0.00",
        drainageTax: "0.00",
        penalty: "0.00",
        interest: "0.00",
        currentYearDemand: "1500.00",
      },
    })
    const figures = outstandingToNoticeLedger(breakdown)
    const dues = {
      id: "cuid-1",
      surveyId: "249044-001-000001-001-R",
      wardNumber: 1,
      wardName: "Ward 1",
      ownerName: "Ram",
      ownerFatherName: "Shyam",
      mobileMasked: "XXXXXX3210",
      propertyNo: "1",
      parcelNo: "10",
      houseNo: "3",
      streetName: null,
      locality: "Test",
      colony: null,
      city: "Chhata",
      pincode: null,
      propertyUse: "Residential",
      taxRateZone: "BELOW_9M",
      roadType: null,
      assessmentYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
      taxConfig: { id: "cfg", version: 1 },
      floors: [],
      tax: {
        propertyTaxPct: 10,
        waterTaxPct: 7.5,
        drainageTaxPct: 2.5,
        penaltyPct: 0,
        assessablePct: 80,
        commercialAssessablePct: 80,
        propertyTax: 1500,
        waterTax: 0,
        drainageTax: 0,
        penalty: 0,
        totalDemand: 1500,
        annualBaseRate: null,
        configFound: true,
      },
    }
    const vm = duesPayloadToNoticeViewModel(dues, {
      ledger: figures.ledger,
      snapshot: figures.snapshot,
    })
    expect(vm.ledger.previousArrears).toBe(250)
    expect(vm.ledger.currentYearDemand).toBe(1500)
    expect(vm.ledger.totalPayable).toBe(1750)
    expect(vm.ledger.netOutstanding).toBe(1750)
    expect(vm.totalDemand).toBe(1500)
    const html = generateDemandNoticeDocumentHtml([vm], { forPdf: true })
    expect(html).toContain("1,750.00")
    expect(html).toContain("1,500.00")
    expect(html).toContain("250.00")
    expect(html).toContain("पूर्व वर्षों का बकाया")
    expect(html).toContain("Property Tax")
    expect(html).toContain("Water Tax")
    expect(html).toContain("Drainage Tax")
    expect(html).toContain("Penalty and Interest")
    expect(html).toContain("Rebate/Credits")
    expect(html).toContain("Payments")
    expect(html).toContain("Outstanding")
    expect(html).not.toContain("Original Demand")
    expect(html).toContain("repeat(4, minmax(0, 1fr))")
    expect(html).toContain("Previous Dues / पूर्व बकाया")
    expect(html).toContain("width: 100%")
    expect(vm.propertyTax + vm.waterTax + vm.drainageTax + vm.penalty).toBe(
      vm.totalDemand
    )
  })

  it("prints component headings and a total equal to those components", () => {
    const breakdown = calculateOutstanding({
      selectedYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
      demands: [],
      payments: [],
      calculatedCurrent: {
        propertyTax: "2400.00",
        waterTax: "1800.00",
        drainageTax: "0.00",
        penalty: "0.00",
        interest: "0.00",
        currentYearDemand: "4200.00",
      },
    })
    const figures = outstandingToNoticeLedger(breakdown)
    const dues = {
      id: "cuid-2",
      surveyId: "249044-001-000002-001-R",
      wardNumber: 1,
      wardName: "Ward 1",
      ownerName: "Ram",
      ownerFatherName: "Shyam",
      mobileMasked: "XXXXXX3210",
      propertyNo: "2",
      parcelNo: "11",
      houseNo: "4",
      streetName: null,
      locality: "Test",
      colony: null,
      city: "Chhata",
      pincode: null,
      propertyUse: "Residential",
      taxRateZone: "BELOW_9M",
      roadType: null,
      assessmentYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
      taxConfig: { id: "cfg", version: 1 },
      floors: [],
      tax: {
        propertyTaxPct: 10,
        waterTaxPct: 7.5,
        drainageTaxPct: 2.5,
        penaltyPct: 10,
        assessablePct: 80,
        commercialAssessablePct: 80,
        propertyTax: 2400,
        waterTax: 1800,
        drainageTax: 0,
        penalty: 0,
        totalDemand: 4200,
        annualBaseRate: null,
        configFound: true,
      },
    }
    const vm = duesPayloadToNoticeViewModel(dues, {
      ledger: figures.ledger,
      snapshot: figures.snapshot,
    })
    expect(vm.propertyTax + vm.waterTax + vm.drainageTax + vm.penalty).toBe(4200)
    const html = generateDemandNoticeDocumentHtml([vm], { forPdf: true })
    expect(html).toContain("Property Tax (10%) / संपत्ति कर")
    expect(html).toContain("Water Tax (7.5%) / जल कर")
    expect(html).toContain("Drainage Tax (2.5%) / नाली कर")
    expect(html).toContain("Penalty (10%) / शास्ति")
    expect(html).toContain("Total Demand / कुल मांग")
    expect(html).toContain("4,200.00")
    expect(html).toContain("2,400.00")
    expect(html).toContain("1,800.00")
    expect(html).toContain("No published year-wise demands on the ledger.")
  })

  it("shows a closing-only balance without invented component amounts", () => {
    const opening = {
      id: "d-open",
      assessmentYearId: "2023-2024",
      assessmentYearCode: "2023-2024",
      assessmentYearName: "2023-2024",
      propertyTax: "500.00",
      waterTax: "0.00",
      drainageTax: "0.00",
      penalty: "0.00",
      interest: "0.00",
      currentYearDemand: "500.00",
      credits: "0.00",
      debits: "0.00",
      payments: "0.00",
      balanceKind: "CLOSING_ONLY" as const,
    }
    const breakdown = calculateOutstanding({
      selectedYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
      demands: [opening],
      payments: [],
      calculatedCurrent: {
        propertyTax: "100.00",
        waterTax: "0.00",
        drainageTax: "0.00",
        penalty: "0.00",
        interest: "0.00",
        currentYearDemand: "100.00",
      },
    })
    const figures = outstandingToNoticeLedger(breakdown)
    expect(figures.ledger.years[0]?.componentDetail).toBe(false)
    expect(figures.ledger.years[0]?.propertyTax).toBeNull()
    expect(figures.ledger.historicalOpeningArrears).toBe(500)
    const dues = {
      id: "cuid-3",
      surveyId: "249044-001-000003-001-R",
      wardNumber: 1,
      wardName: "Ward 1",
      ownerName: "Ram",
      ownerFatherName: null,
      mobileMasked: "—",
      propertyNo: "3",
      parcelNo: "12",
      houseNo: "5",
      streetName: null,
      locality: "Test",
      colony: null,
      city: "Chhata",
      pincode: null,
      propertyUse: "Residential",
      taxRateZone: null,
      roadType: null,
      assessmentYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
      taxConfig: { id: "cfg", version: 1 },
      floors: [],
      tax: {
        propertyTaxPct: 10,
        waterTaxPct: 7.5,
        drainageTaxPct: 2.5,
        penaltyPct: 0,
        assessablePct: 80,
        commercialAssessablePct: 80,
        propertyTax: 100,
        waterTax: 0,
        drainageTax: 0,
        penalty: 0,
        totalDemand: 100,
        annualBaseRate: null,
        configFound: true,
      },
    }
    const html = generateDemandNoticeDocumentHtml(
      [
        duesPayloadToNoticeViewModel(dues, {
          ledger: figures.ledger,
          snapshot: figures.snapshot,
        }),
      ],
      { forPdf: true }
    )
    expect(html).toContain("Historical opening arrears")
    expect(html).toContain("—")
    expect(html).toContain("500.00")
  })

  it("does not print missing history as a confirmed zero arrears total", () => {
    const breakdown = calculateOutstanding({
      selectedYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
      demands: [],
      payments: [],
      calculatedCurrent: {
        propertyTax: "100.00",
        waterTax: "0.00",
        drainageTax: "0.00",
        penalty: "0.00",
        interest: "0.00",
        currentYearDemand: "100.00",
      },
      missingHistoryYears: [
        {
          assessmentYearId: "2024-2025",
          code: "2024-2025",
          name: "2024-2025",
          reason: "No verified published balance",
        },
      ],
    })
    const figures = outstandingToNoticeLedger(breakdown)
    const dues = {
      id: "cuid-4",
      surveyId: "249044-001-000004-001-R",
      wardNumber: 1,
      wardName: "Ward 1",
      ownerName: "Ram",
      ownerFatherName: null,
      mobileMasked: "—",
      propertyNo: "4",
      parcelNo: "13",
      houseNo: "6",
      streetName: null,
      locality: "Test",
      colony: null,
      city: "Chhata",
      pincode: null,
      propertyUse: "Residential",
      taxRateZone: null,
      roadType: null,
      assessmentYear: { id: "2025-2026", code: "2025-2026", name: "2025-2026" },
      taxConfig: { id: "cfg", version: 1 },
      floors: [],
      tax: {
        propertyTaxPct: 10,
        waterTaxPct: 7.5,
        drainageTaxPct: 2.5,
        penaltyPct: 0,
        assessablePct: 80,
        commercialAssessablePct: 80,
        propertyTax: 100,
        waterTax: 0,
        drainageTax: 0,
        penalty: 0,
        totalDemand: 100,
        annualBaseRate: null,
        configFound: true,
      },
    }
    const html = generateDemandNoticeDocumentHtml(
      [
        duesPayloadToNoticeViewModel(dues, {
          ledger: figures.ledger,
          snapshot: figures.snapshot,
        }),
      ],
      { forPdf: true }
    )
    expect(html).toMatch(/Previous Dues \/ पूर्व बकाया[\s\S]{0,80}Not confirmed/)
    expect(html).toMatch(/Total Demand \/ कुल मांग[\s\S]{0,80}Not confirmed/)
    expect(html).not.toMatch(/Previous Dues \/ पूर्व बकाया[\s\S]{0,80}₹\s*0\.00/)
  })
})

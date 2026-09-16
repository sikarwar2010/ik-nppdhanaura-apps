import type { SurveyForDues } from "../../public-property-tax/dues.util"
import { generateDemandNoticeDocumentHtml } from "./demand-notice-html"
import {
  compareParcelNatural,
  sortDemandNoticeSurveys,
} from "./demand-notice-sort"
import { duesPayloadToNoticeViewModel } from "./demand-notice-view-model"
import {
  partitionDemandNoticeValidation,
  validateSurveyForDemandNotice,
} from "./demand-notice.validation"

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
      propertyUse: "Residential",
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

    const vm = duesPayloadToNoticeViewModel(dues)
    expect(vm.surveyId).toBe(dues.surveyId)
    expect(vm.totalDemand).toBe(69.12)
    expect(vm.assessmentYear).toBe("2025-2026")
    expect(vm.ownerName).toBe("Ram")

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
    expect(html).toContain("second")
    expect(html.match(/class="page"/g)?.length).toBe(2)
    expect(html).not.toContain("Print A4 Notice")
  })
})

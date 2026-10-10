import { taxRateKey } from "../tax/tax-calc"
import {
  buildNoticeFloorLines,
  computePublicDuesPayload,
  pickLatestPublishedConfig,
  type SurveyForDues,
  type TaxConfigForDues,
} from "./dues.util"

function sampleRatesConfig(): TaxConfigForDues {
  return {
    id: "cfg1",
    version: 1,
    assessablePct: 80,
    commercialAssessablePct: 80,
    propertyTaxPct: 10,
    waterTaxPct: 5,
    drainageTaxPct: 3,
    penaltyPct: 0,
    assessmentYear: { id: "y1", code: "2025-26", name: "2025-2026" },
    updatedAt: new Date("2026-01-01"),
    cells: [
      {
        roadWidthEntry: { code: "BELOW_9M" },
        constructionEntry: { code: "PAKKA_BUILDING_WITH_RCC_ROOF" },
        annualRatePerSqFt: 0.36,
      },
    ],
  }
}

describe("pickLatestPublishedConfig", () => {
  it("picks highest assessment year code", () => {
    const older = {
      ...sampleRatesConfig(),
      id: "old",
      assessmentYear: { id: "y0", code: "2024-25", name: "2024-2025" },
    }
    const newer = sampleRatesConfig()
    expect(pickLatestPublishedConfig([older, newer])?.id).toBe("cfg1")
  })

  it("returns null for empty list", () => {
    expect(pickLatestPublishedConfig([])).toBeNull()
  })
})

describe("buildNoticeFloorLines", () => {
  it("builds floor ALV lines from rates", () => {
    const survey: SurveyForDues = {
      id: "s1",
      surveyId: "SUR-1",
      ownerName: "Ram",
      ownerFatherName: "Shyam",
      mobile: "9876543210",
      propertyNo: "1",
      parcelNo: "2",
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
      floors: [
        {
          floorLabel: "Ground",
          usageType: "Residential",
          usageFactor: "1",
          buildingType: "RCC",
          areaSqFt: 100,
        },
      ],
    }
    const rates = {
      assessablePct: 80,
      commercialAssessablePct: 80,
      propertyTaxPct: 10,
      waterTaxPct: 5,
      drainageTaxPct: 3,
      penaltyPct: 0,
      rateByZoneAndConstruction: new Map([
        [taxRateKey("BELOW_9M", "PAKKA_BUILDING_WITH_RCC_ROOF"), 0.36],
      ]),
      anyRateByZone: new Map([["BELOW_9M", 0.36]]),
    }
    const lines = buildNoticeFloorLines(survey, rates)
    expect(lines).toHaveLength(1)
    expect(lines[0]?.areaSqFt).toBe(100)
    expect(lines[0]?.rate).toBe(0.36)
    expect(lines[0]?.tax).toBeGreaterThan(0)
  })

  it("doubles rate on notice for commercial floor usage", () => {
    const survey: SurveyForDues = {
      id: "s2",
      surveyId: "SUR-2",
      ownerName: "Shyam",
      ownerFatherName: "Mohan",
      mobile: "9876543210",
      propertyNo: "1",
      parcelNo: "2",
      houseNo: "3",
      streetName: null,
      locality: "Test",
      colony: null,
      city: "Chhata",
      pincode: null,
      propertyUse: "Residential Self",
      taxRateZone: "BELOW_9M",
      roadType: null,
      hasMunicipalWaterSupply: true,
      plotAreaSqFt: null,
      plinthAreaSqFt: null,
      totalBuiltUpAreaSqFt: null,
      ward: { number: 1, name: "Ward 1" },
      floors: [
        {
          floorLabel: "Ground Floor",
          usageType: "Commercial",
          usageFactor: "Self Occupied",
          buildingType: "Pakka Building with R.C.C Roof",
          areaSqFt: 420,
        },
      ],
    }
    const rates = {
      assessablePct: 80,
      commercialAssessablePct: 80,
      propertyTaxPct: 10,
      waterTaxPct: 7.5,
      drainageTaxPct: 2.5,
      penaltyPct: 0,
      rateByZoneAndConstruction: new Map([
        [taxRateKey("BELOW_9M", "PAKKA_BUILDING_WITH_RCC_ROOF"), 0.6],
      ]),
      anyRateByZone: new Map([["BELOW_9M", 0.6]]),
    }
    const lines = buildNoticeFloorLines(survey, rates)
    expect(lines).toHaveLength(1)
    expect(lines[0]?.rate).toBe(1.2)
    expect(lines[0]?.alv).toBe(4838.4)
    expect(lines[0]?.tax).toBe(483.84)
  })

  it.each([
    { usageType: "Residential", expectedRate: 0.6 },
    { usageType: "Commercial", expectedRate: 1.2 },
  ])(
    "uses the zone's Tin Shed rate for Other Pakka Building ($usageType)",
    ({ usageType, expectedRate }) => {
      const survey: SurveyForDues = {
        id: "other-pakka",
        surveyId: "SUR-OTHER-PAKKA",
        ownerName: "Ram",
        ownerFatherName: "Shyam",
        mobile: null,
        propertyNo: "1",
        parcelNo: "2",
        houseNo: "3",
        streetName: null,
        locality: "Test",
        colony: null,
        city: "Chhata",
        pincode: null,
        propertyUse: usageType,
        taxRateZone: "BELOW_9M",
        roadType: null,
        hasMunicipalWaterSupply: true,
        plotAreaSqFt: null,
        plinthAreaSqFt: null,
        totalBuiltUpAreaSqFt: null,
        ward: { number: 1, name: "Ward 1" },
        floors: [
          {
            floorLabel: "Ground Floor",
            usageType,
            usageFactor: "Self Occupied",
            buildingType: "Other Pakka Building",
            areaSqFt: 100,
          },
        ],
      }
      const rates = {
        assessablePct: 80,
        commercialAssessablePct: 80,
        propertyTaxPct: 10,
        waterTaxPct: 7.5,
        drainageTaxPct: 2.5,
        penaltyPct: 0,
        rateByZoneAndConstruction: new Map([
          [taxRateKey("BELOW_9M", "PAKKA_BUILDING_WITH_RCC_ROOF"), 0.8],
          [taxRateKey("BELOW_9M", "TIN_SHED"), 0.6],
        ]),
        anyRateByZone: new Map([["BELOW_9M", 0.8]]),
      }

      const lines = buildNoticeFloorLines(survey, rates)
      expect(lines).toHaveLength(1)
      expect(lines[0]?.rate).toBe(expectedRate)
    }
  )

  it("GIS Use Code C doubles notice rate even when propertyUse is Residential", () => {
    const survey: SurveyForDues = {
      id: "s3",
      surveyId: "249044-001-000131-001-C",
      ownerName: "Shyam",
      ownerFatherName: "Mohan",
      mobile: "9876543210",
      propertyNo: "1",
      parcelNo: "2",
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
      floors: [
        {
          floorLabel: "Ground Floor",
          usageType: "Residential",
          usageFactor: "Self Occupied",
          buildingType: "Pakka Building with R.C.C Roof",
          areaSqFt: 420,
        },
      ],
    }
    const rates = {
      assessablePct: 80,
      commercialAssessablePct: 80,
      propertyTaxPct: 10,
      waterTaxPct: 7.5,
      drainageTaxPct: 2.5,
      penaltyPct: 0,
      rateByZoneAndConstruction: new Map([
        [taxRateKey("BELOW_9M", "PAKKA_BUILDING_WITH_RCC_ROOF"), 0.6],
      ]),
      anyRateByZone: new Map([["BELOW_9M", 0.6]]),
    }
    const lines = buildNoticeFloorLines(survey, rates)
    expect(lines[0]?.rate).toBe(1.2)
    expect(lines[0]?.tax).toBe(483.84)
  })

  it("GIS Use Code R does not double notice rate for commercial floor usage", () => {
    const survey: SurveyForDues = {
      id: "s4",
      surveyId: "249044-001-000131-001-R",
      ownerName: "Ram",
      ownerFatherName: "Shyam",
      mobile: "9876543210",
      propertyNo: "1",
      parcelNo: "2",
      houseNo: "3",
      streetName: null,
      locality: "Test",
      colony: null,
      city: "Chhata",
      pincode: null,
      propertyUse: "Residential Self",
      taxRateZone: "BELOW_9M",
      roadType: null,
      hasMunicipalWaterSupply: true,
      plotAreaSqFt: null,
      plinthAreaSqFt: null,
      totalBuiltUpAreaSqFt: null,
      ward: { number: 1, name: "Ward 1" },
      floors: [
        {
          floorLabel: "Ground Floor",
          usageType: "Commercial",
          usageFactor: "Self Occupied",
          buildingType: "Pakka Building with R.C.C Roof",
          areaSqFt: 420,
        },
      ],
    }
    const rates = {
      assessablePct: 80,
      commercialAssessablePct: 80,
      propertyTaxPct: 10,
      waterTaxPct: 7.5,
      drainageTaxPct: 2.5,
      penaltyPct: 0,
      rateByZoneAndConstruction: new Map([
        [taxRateKey("BELOW_9M", "PAKKA_BUILDING_WITH_RCC_ROOF"), 0.6],
      ]),
      anyRateByZone: new Map([["BELOW_9M", 0.6]]),
    }
    const lines = buildNoticeFloorLines(survey, rates)
    expect(lines[0]?.rate).toBe(0.6)
    expect(lines[0]?.tax).toBe(241.92)
  })
})

describe("computePublicDuesPayload", () => {
  it("includes owner names and property type from the survey", () => {
    const survey: SurveyForDues = {
      id: "s1",
      surveyId: "SUR-1",
      ownerName: "Ram",
      ownerFatherName: "Shyam",
      mobile: "9876543210",
      propertyNo: "1",
      parcelNo: "2",
      houseNo: "3",
      streetName: null,
      locality: "Test",
      colony: null,
      city: "Chhata",
      pincode: null,
      propertyType: "Residential",
      propertyUse: "Residential",
      taxRateZone: "BELOW_9M",
      roadType: null,
      hasMunicipalWaterSupply: true,
      plotAreaSqFt: null,
      plinthAreaSqFt: null,
      totalBuiltUpAreaSqFt: null,
      ward: { number: 1, name: "Ward 1" },
      floors: [
        {
          floorLabel: "Ground",
          usageType: "Residential",
          usageFactor: "1",
          buildingType: "RCC",
          areaSqFt: 100,
        },
      ],
    }
    const payload = computePublicDuesPayload(survey, sampleRatesConfig())
    expect(payload.ownerName).toBe("Ram")
    expect(payload.ownerFatherName).toBe("Shyam")
    expect(payload.propertyType).toBe("Residential")
  })
})

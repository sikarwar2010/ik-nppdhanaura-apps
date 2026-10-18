import { TaxConfigsService } from "./tax-configs.service"
import {
  buildTaxPreview,
  decimalToString,
  type TaxConfigRecord,
} from "./tax-config-read"

function config(overrides: Partial<TaxConfigRecord> = {}): TaxConfigRecord {
  return {
    id: "cfg-1",
    wardId: "ward-1",
    assessmentYearId: "year-1",
    status: "PUBLISHED",
    version: 3,
    propertyTaxPct: "10",
    waterTaxPct: "7.5",
    drainageTaxPct: "2.5",
    penaltyPct: "0",
    assessablePct: "80",
    commercialAssessablePct: "80",
    cells: [
      {
        roadWidthEntryId: "road-1",
        constructionEntryId: "construction-1",
        annualRatePerSqFt: "0.5",
      },
    ],
    ...overrides,
  }
}

describe("decimalToString", () => {
  it("keeps zero and fractional rates and treats blank values as missing", () => {
    expect(decimalToString("0")).toBe("0")
    expect(decimalToString("0.5")).toBe("0.5")
    expect(decimalToString(0)).toBe("0")
    expect(decimalToString("1")).toBe("1")
    expect(decimalToString("80")).toBe("80")
    expect(decimalToString(null)).toBeNull()
    expect(decimalToString("")).toBeNull()
    expect(decimalToString("not-a-rate")).toBeNull()
  })
})

describe("TaxConfigsService.get", () => {
  function harness(findUnique: jest.Mock, create = jest.fn()) {
    const prisma = {
      taxConfig: { findUnique, create },
      ward: { findUnique: jest.fn().mockResolvedValue({ id: "ward-1" }) },
      referenceEntry: {
        findUnique: jest.fn().mockResolvedValue({ id: "year-1" }),
      },
    }
    const audit = { log: jest.fn() }
    return {
      service: new TaxConfigsService(prisma as never, audit as never),
      prisma,
    }
  }

  it("loads saved percentages and a zero-capable cell without inserting a row", async () => {
    const findUnique = jest.fn().mockResolvedValue(
      config({
        penaltyPct: "0",
        cells: [
          {
            roadWidthEntryId: "road-1",
            constructionEntryId: "construction-1",
            annualRatePerSqFt: "0",
          },
          {
            roadWidthEntryId: "road-1",
            constructionEntryId: "construction-2",
            annualRatePerSqFt: "0.5",
          },
        ],
      })
    )
    const { service, prisma } = harness(findUnique)
    const result = await service.get("ward-1", "year-1")
    expect(result.configured).toBe(true)
    if (!result.configured) return
    expect(result.propertyTaxPct).toBe("10")
    expect(result.waterTaxPct).toBe("7.5")
    expect(result.drainageTaxPct).toBe("2.5")
    expect(result.penaltyPct).toBe("0")
    expect(result.assessablePct).toBe("80")
    expect(result.commercialAssessablePct).toBe("80")
    expect(result.cells.map((cell) => cell.annualRatePerSqFt)).toEqual([
      "0",
      "0.5",
    ])
    expect(prisma.taxConfig.create).not.toHaveBeenCalled()
  })

  it("returns configured false when no row exists and does not create zeros", async () => {
    const findUnique = jest.fn().mockResolvedValue(null)
    const { service, prisma } = harness(findUnique)
    await expect(service.get("ward-1", "year-1")).resolves.toEqual({
      configured: false,
      wardId: "ward-1",
      assessmentYearId: "year-1",
    })
    expect(prisma.taxConfig.create).not.toHaveBeenCalled()
  })

  it("returns only the configuration for the requested assessment year", async () => {
    const findUnique = jest.fn().mockImplementation(async ({ where }) => {
      const year = where.wardId_assessmentYearId.assessmentYearId as string
      return config({
        id: year,
        assessmentYearId: year,
        propertyTaxPct: year === "year-1" ? "10" : "12",
        cells: [
          {
            roadWidthEntryId: "road-1",
            constructionEntryId: "construction-1",
            annualRatePerSqFt: year === "year-1" ? "1" : "0.3",
          },
        ],
      })
    })
    const { service } = harness(findUnique)
    const first = await service.get("ward-1", "year-1")
    const second = await service.get("ward-1", "year-2")
    expect(first.configured && first.cells[0]?.annualRatePerSqFt).toBe("1")
    expect(first.configured && first.propertyTaxPct).toBe("10")
    expect(second.configured && second.cells[0]?.annualRatePerSqFt).toBe("0.3")
    expect(second.configured && second.propertyTaxPct).toBe("12")
  })
})

describe("buildTaxPreview", () => {
  const input = {
    wardId: "ward-1",
    assessmentYearId: "year-1",
    areaSqFt: 100,
    roadWidthEntryId: "road-1",
    constructionEntryId: "construction-1",
    gisUseCode: "R",
  }

  it("uses the saved configuration, including a stored zero rate", () => {
    const saved = buildTaxPreview(
      config({
        cells: [
          {
            roadWidthEntryId: "road-1",
            constructionEntryId: "construction-1",
            annualRatePerSqFt: "0",
          },
        ],
      }),
      input
    )
    expect(saved.configured).toBe(true)
    expect(saved.rateMissing).toBe(false)
    expect(saved.rates?.annualRate).toBe(0)
    expect(saved.rates?.propertyTaxPct).toBe("10")
    expect(saved.rates?.waterTaxPct).toBe("7.5")
    expect(saved.calculation?.propertyTax).toBe(0)
    expect(saved.calculation?.demand).toBe(0)
  })

  it("reports a missing cell instead of treating it as zero", () => {
    const missing = buildTaxPreview(config({ cells: [] }), input)
    expect(missing.configured).toBe(true)
    expect(missing.rateMissing).toBe(true)
    expect(missing.calculation).toBeNull()
    expect(missing.rates?.annualRate).toBeNull()
    expect(missing.rates?.waterTaxPct).toBe("7.5")
  })

  it("does not preview a different assessment year as the selected configuration", () => {
    const otherYear = buildTaxPreview(config(), {
      ...input,
      assessmentYearId: "year-2",
    })
    expect(otherYear.configured).toBe(false)
    expect(otherYear.rateMissing).toBe(true)
    expect(otherYear.calculation).toBeNull()
  })
})

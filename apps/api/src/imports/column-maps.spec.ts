import path from "path"

import ExcelJS from "exceljs"

import {
  CHHATA_V1_38,
  CHHATA_V2_55,
  cell,
  detectPreset,
  detectPresetFromHeaders,
  extractWardNumber,
  getMapping,
  normalizeParcelNo,
  parseBool,
  parseNumber,
  parseSurveyedAt,
  resolveColumnMap,
} from "./column-maps"

const FIXTURES = path.join(__dirname, "../../../../fixtures/survey")

/** Exact header row from Ward 01.xlsx (Mainpuri GIS, 41 columns). */
const MAINPURI_WARD01_HEADERS = [
  "Assessment Year",
  "Survey Id",
  "Date of Survey",
  "Owner Name",
  "Owner Father Name",
  "Mobile No",
  "Ward Name",
  "Is Slum",
  "Remark",
  "Parcel No",
  "Property No",
  "Respondent Name",
  "Respondent Relationship",
  "City",
  "Pincode",
  "Is Same As Property",
  "House No",
  "Street Name",
  "Locality",
  "Colony",
  "Tax Rate Zone",
  "Property Ownership",
  "Property Type",
  "Property Uses",
  "Year of Construction",
  "Situation",
  "Road Type",
  "Floors",
  "Plot Area SqFt",
  "Plot Area SqMeter",
  "Plinth Area SqFt",
  "Plinth Area SqMeter",
  "Total Built Up Area SqFt",
  "Total Built Up Area SqMeter",
  "Is Muncipal Water Supply",
  "Total Water Connection",
  "Water Connection Id/Type",
  "Toilet Type",
  "Is Muncipal Waste Service",
  "Is Muncipal Water Supply",
  "Is Muncipal Water Supply",
] as const

describe("column-maps", () => {
  it("detects presets by column count", () => {
    expect(detectPreset(38)).toBe("chhata-v1-38")
    expect(detectPreset(55)).toBe("chhata-v2-55")
  })

  it("detects presets from Excel headers", () => {
    expect(detectPresetFromHeaders(["Survey Id", "Date of Survey"])).toBe(
      "chhata-v1-38"
    )
    expect(detectPresetFromHeaders(["SN", "Actions", "Survey Id"])).toBe(
      "chhata-v2-55"
    )
    expect(detectPresetFromHeaders(["S.No", "Actions"])).toBe("chhata-v2-55")
    expect(detectPresetFromHeaders([...MAINPURI_WARD01_HEADERS])).toBe(
      "mainpuri-v1-41"
    )
  })

  it("extracts ward numbers from Hindi names and GIS ids", () => {
    expect(extractWardNumber("वार्ड नंबर 2 - शेरगढ रोड़", "")).toBe(2)
    expect(extractWardNumber("", "249044-001-000001-001-R")).toBe(1)
    expect(extractWardNumber("Vijay singh", "249044-001-000001-001-R")).toBe(1)
    expect(
      extractWardNumber("वार्ड नंबर 2 - शेरगढ रोड़", "249044-000-000232-006-C")
    ).toBe(2)
    expect(extractWardNumber("", "249044-000-000232-006-C")).toBeNull()
    expect(extractWardNumber("वार्ड नं0 11", "")).toBe(11)
    expect(extractWardNumber("वार्ड नं 11", "")).toBe(11)
    expect(extractWardNumber("वार्ड संख्या 11", "")).toBe(11)
    expect(extractWardNumber("वार्ड सं0 16", "")).toBe(16)
    expect(extractWardNumber("वार्ड न० 1 नगर पालिका", "")).toBe(1)
    expect(extractWardNumber("Ward No. 5", "")).toBe(5)
  })

  it("parses sentinels safely", () => {
    expect(parseBool("N/A")).toBeUndefined()
    expect(parseBool("Yes")).toBe(true)
    expect(parseNumber("1,200.5")).toBe(1200.5)
    expect(parseNumber("null")).toBeUndefined()
    expect(cell(["N/A"], 0)).toBe("")
    expect(cell([0], 0)).toBe("0")
  })

  it("parses GIS survey dates and prefers Excel parcel over Survey Id", () => {
    const surveyed = parseSurveyedAt("16 June 2025 at 05:46:13 pm")
    expect(surveyed?.getFullYear()).toBe(2025)
    expect(surveyed?.getMonth()).toBe(5)
    // Excel parcel wins (padded) even when Survey Id segment differs
    expect(normalizeParcelNo("1", "249044-001-000008-001-R")).toBe("000001")
    expect(normalizeParcelNo("363", "249044-002-000362-001-C")).toBe("000363")
    // Empty Excel → fall back to Survey Id segment
    expect(normalizeParcelNo("", "249044-001-000008-001-R")).toBe("000008")
  })

  it("maps Ward 1 fixture columns to v1 indexes", async () => {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(path.join(FIXTURES, "Ward 1.xlsx"))
    const sheet = workbook.worksheets[0]
    const headers: string[] = []
    sheet.getRow(1).eachCell({ includeEmpty: true }, (c, col) => {
      headers[col - 1] = String(c.value ?? "")
    })
    expect(detectPresetFromHeaders(headers, sheet.columnCount)).toBe(
      "chhata-v1-38"
    )
    const map = getMapping("chhata-v1-38")
    expect(headers[map.surveyId].toLowerCase()).toContain("survey")
    expect(headers[map.ownerName].toLowerCase()).toContain("owner name")
    expect(headers[map.wardName].toLowerCase()).toContain("ward")
    expect(headers[map.parcelNo].toLowerCase()).toContain("parcel")
    expect(map).toEqual(CHHATA_V1_38)

    const values: unknown[] = []
    for (let col = 1; col <= sheet.columnCount; col++) {
      values[col - 1] = sheet.getRow(2).getCell(col).value
    }
    expect(cell(values, map.surveyId)).toMatch(/^\d+-\d{3}-\d+-/)
    expect(cell(values, map.ownerName)).toBe("Vijay singh")
    expect(
      normalizeParcelNo(cell(values, map.parcelNo), cell(values, map.surveyId))
    ).toBe("000001")
    expect(parseBool(cell(values, map.hasMunicipalWaterSupply))).toBe(false)
    expect(parseBool(cell(values, map.hasAlternateWater))).toBe(true)
    expect(cell(values, map.waterSourceType)).toBe("Dug well")
    expect(cell(values, map.toiletType)).toBe("Connected to specific tank")
  })

  it("maps Ward 2 fixture columns to v2 indexes", async () => {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(path.join(FIXTURES, "Ward 2.xlsx"))
    const sheet = workbook.worksheets[0]
    const headers: string[] = []
    sheet.getRow(1).eachCell({ includeEmpty: true }, (c, col) => {
      headers[col - 1] = String(c.value ?? "")
    })
    expect(detectPresetFromHeaders(headers, sheet.columnCount)).toBe(
      "chhata-v2-55"
    )
    const map = getMapping("chhata-v2-55")
    expect(headers[map.surveyId].toLowerCase()).toContain("survey")
    expect(headers[map.parcelNo].toLowerCase()).toContain("parcel")
    expect(headers[map.ownerAadhaar ?? -1]?.toLowerCase()).toContain("aadhaar")
    expect(map.surveyId).toBe(CHHATA_V2_55.surveyId)
    expect(map.parcelNo).toBe(10)

    const values: unknown[] = []
    for (let col = 1; col <= sheet.columnCount; col++) {
      values[col - 1] = sheet.getRow(2).getCell(col).value
    }
    expect(cell(values, map.surveyId)).toBe("249044-002-000001-001-C")
    expect(cell(values, 0)).toBe("1442")
    expect(
      normalizeParcelNo(cell(values, map.parcelNo), cell(values, map.surveyId))
    ).toBe("000001")
  })

  it("resolves Mainpuri Ward 01 headers without cross-mapping Use/Commercial", () => {
    const { preset, map } = resolveColumnMap([...MAINPURI_WARD01_HEADERS])
    expect(preset).toBe("mainpuri-v1-41")
    expect(MAINPURI_WARD01_HEADERS[map.pincode]).toBe("Pincode")
    expect(MAINPURI_WARD01_HEADERS[map.taxRateZone]).toBe("Tax Rate Zone")
    expect(MAINPURI_WARD01_HEADERS[map.propertyOwnership]).toBe(
      "Property Ownership"
    )
    expect(MAINPURI_WARD01_HEADERS[map.propertyType!]).toBe("Property Type")
    expect(MAINPURI_WARD01_HEADERS[map.propertyUse]).toBe("Property Uses")
    expect(map.commercial).toBe(-1)
    expect(MAINPURI_WARD01_HEADERS[map.colony]).toBe("Colony")
    expect(MAINPURI_WARD01_HEADERS[map.yearOfConstruction]).toBe(
      "Year of Construction"
    )
    expect(MAINPURI_WARD01_HEADERS[map.situation]).toBe("Situation")
    expect(MAINPURI_WARD01_HEADERS[map.roadType]).toBe("Road Type")

    const sample: unknown[] = new Array(MAINPURI_WARD01_HEADERS.length).fill("")
    sample[map.pincode] = 205001
    sample[map.colony] = "Nagla Pajwa"
    sample[map.taxRateZone] = "RATE ZONE 3 (12 meters and upto 24 meters)"
    sample[map.propertyOwnership] = "Individual (Single/Joint)"
    sample[map.propertyType!] = "Mix"
    sample[map.propertyUse] = "Residential/Commercial"
    sample[map.yearOfConstruction] = "After 1997"
    sample[map.situation] = "Main Road"
    sample[map.roadType] = "Dambar Road"

    const pincode = cell(sample, map.pincode)
    const propertyUse = cell(sample, map.propertyUse)
    const propertyType = cell(sample, map.propertyType)
    const commercial = cell(sample, map.commercial)
    const taxRateZone = cell(sample, map.taxRateZone)
    const colony = cell(sample, map.colony)

    expect(pincode).toBe("205001")
    expect(propertyUse).toBe("Residential/Commercial")
    expect(propertyType).toBe("Mix")
    expect(commercial).toBe("")
    expect(taxRateZone).toContain("RATE ZONE 3")
    expect(propertyUse).not.toBe(pincode)
    expect(propertyUse).not.toBe(taxRateZone)
    expect(propertyUse).not.toBe(colony)
    expect(commercial).not.toBe(taxRateZone)
  })

  it("keeps Chhata Property Use/Commercial when refining v1 headers", () => {
    const headers = [
      "Survey Id",
      "Date of Survey",
      "Owner Name",
      "Owner Father Name",
      "Mobile No",
      "Ward Name",
      "Is Slum",
      "Parcel No",
      "Property No",
      "Respondent Name",
      "Respondent Relationship",
      "City",
      "Pincode",
      "House No",
      "Street Name",
      "Locality",
      "Colony",
      "Tax Rate Zone",
      "Property Ownership",
      "Property Use",
      "Commercial",
      "Year of Construction",
      "Situation",
      "Road Type",
      "Floors",
      "Plot Area SqFt",
      "Plot Area SqMeter",
      "Plinth Area SqFt",
      "Plinth Area SqMeter",
      "Total Built Up Area SqFt",
      "Total Built Up Area SqMeter",
      "Is Muncipal Water Supply",
      "Total Water Connection",
      "Water Connection Id/Type",
      "Toilet Type",
      "Is Muncipal Waste Service",
      "Is Muncipal Water Supply",
      "Is Muncipal Water Supply",
    ]
    const { map } = resolveColumnMap(headers)
    expect(headers[map.propertyUse]).toBe("Property Use")
    expect(headers[map.commercial]).toBe("Commercial")
    expect(map.propertyType == null || map.propertyType < 0).toBe(true)
  })
})

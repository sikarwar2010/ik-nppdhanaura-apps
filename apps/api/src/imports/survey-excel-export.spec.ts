import path from "path"

import ExcelJS from "exceljs"

import { cell, getMapping, parseBool, parseSurveyedAt } from "./column-maps"
import {
  buildSurveyExportWorkbook,
  CHHATA_V1_HEADERS,
  CHHATA_V2_HEADERS,
  detectExportPreset,
  getExportHeaders,
  MAINPURI_V1_HEADERS,
  SURVEY_EXPORT_SHEET_NAME,
  surveyToExcelRow,
  type SurveyExportRecord,
} from "./survey-excel-export"

const FIXTURES = path.join(__dirname, "../../../../fixtures/survey")

async function loadFixture(fileName: string) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(path.join(FIXTURES, fileName))
  const sheet = workbook.worksheets[0]
  if (!sheet) throw new Error(`Sheet not found in ${fileName}`)
  const headers: string[] = []
  sheet.getRow(1).eachCell({ includeEmpty: true }, (c, col) => {
    headers[col - 1] = String(c.value ?? "")
  })
  const row2: unknown[] = []
  for (let col = 1; col <= sheet.columnCount; col++) {
    row2[col - 1] = sheet.getRow(2).getCell(col).value
  }
  return { headers, row2, sheet }
}

describe("survey-excel-export", () => {
  it("detects export preset as Mainpuri for this municipality", () => {
    expect(detectExportPreset(1)).toBe("mainpuri-v1-41")
    expect(detectExportPreset(2)).toBe("mainpuri-v1-41")
    expect(detectExportPreset(undefined)).toBe("mainpuri-v1-41")
  })

  it("matches Ward 1 and Ward 2 fixture headers for Chhata presets", async () => {
    const w1 = await loadFixture("Ward 1.xlsx")
    const w2 = await loadFixture("Ward 2.xlsx")

    expect([...CHHATA_V1_HEADERS]).toEqual(w1.headers)
    expect([...CHHATA_V2_HEADERS]).toEqual(w2.headers)
    expect(getExportHeaders("chhata-v1-38")).toEqual(w1.headers)
    expect(getExportHeaders("chhata-v2-55")).toEqual(w2.headers)
  })

  it("exports Mainpuri Property Type and Property Uses without cross-map", () => {
    const map = getMapping("mainpuri-v1-41")
    const survey: SurveyExportRecord = {
      surveyId: "205001-001-00001-001-M",
      surveyedAt: null,
      ownerName: "Test",
      ownerFatherName: null,
      mobile: null,
      ownerAadhaar: null,
      isSlum: false,
      remark: null,
      parcelNo: "00001",
      propertyNo: "001",
      electricityId: null,
      khasraNo: null,
      registryNo: null,
      constructedDate: null,
      respondentName: null,
      respondentRelationship: null,
      city: "Mainpuri",
      pincode: "205001",
      houseNo: null,
      streetName: null,
      locality: null,
      colony: "Nagla Pajwa",
      presentHouseNo: null,
      presentStreetName: null,
      presentLocality: null,
      presentColony: null,
      presentCity: null,
      presentPincode: null,
      isSameAsProperty: null,
      taxRateZone: "RATE ZONE 3 (12 meters and upto 24 meters)",
      propertyOwnership: "Individual (Single/Joint)",
      propertyType: "Mix",
      propertyUse: "Residential/Commercial",
      commercial: null,
      yearOfConstruction: "After 1997",
      exemptionType: null,
      exemptionApplicable: null,
      situation: "Main Road",
      roadType: "Dambar Road",
      floorsRaw: null,
      plotAreaSqFt: null,
      plotAreaSqMeter: null,
      plinthAreaSqFt: null,
      plinthAreaSqMeter: null,
      totalBuiltUpAreaSqFt: null,
      totalBuiltUpAreaSqMeter: null,
      hasMunicipalWaterSupply: null,
      hasAlternateWater: null,
      waterSourceType: null,
      totalWaterConnections: null,
      waterConnectionIdType: null,
      toiletType: null,
      hasMunicipalWasteService: null,
      ward: { name: "वार्ड नंबर 01 - नगला पजावा", number: 1 },
    }

    const exported = surveyToExcelRow(survey, "mainpuri-v1-41")
    const headers = getExportHeaders("mainpuri-v1-41")

    expect(headers[map.pincode]).toBe("Pincode")
    expect(headers[map.propertyType!]).toBe("Property Type")
    expect(headers[map.propertyUse]).toBe("Property Uses")
    expect(exported[map.pincode]).toBe("205001")
    expect(exported[map.propertyType!]).toBe("Mix")
    expect(exported[map.propertyUse]).toBe("Residential/Commercial")
    expect(exported[map.taxRateZone]).toContain("RATE ZONE 3")
    expect(exported[map.colony]).toBe("Nagla Pajwa")
    expect(exported[map.propertyUse]).not.toBe(exported[map.pincode])
    expect(exported[map.propertyUse]).not.toBe(exported[map.colony])
    expect(exported[map.surveyId]).toBe("205001-001-00001-001-M")
    expect(exported[map.parcelNo]).toBe("00001")
    expect(getExportHeaders("mainpuri-v1-41")).toEqual([...MAINPURI_V1_HEADERS])
  })

  it("exports Ward 1 fixture row values at mapped columns", async () => {
    const { row2 } = await loadFixture("Ward 1.xlsx")
    const map = getMapping("chhata-v1-38")
    const surveyedAt = parseSurveyedAt(cell(row2, map.surveyedAt)) ?? null

    const survey: SurveyExportRecord = {
      surveyId: cell(row2, map.surveyId),
      surveyedAt,
      ownerName: cell(row2, map.ownerName),
      ownerFatherName: cell(row2, map.ownerFatherName),
      mobile: cell(row2, map.mobile),
      ownerAadhaar: null,
      isSlum: parseBool(cell(row2, map.isSlum)) ?? false,
      remark: null,
      parcelNo: "000001",
      propertyNo: "001",
      electricityId: null,
      khasraNo: null,
      registryNo: null,
      constructedDate: null,
      respondentName: cell(row2, map.respondentName),
      respondentRelationship: cell(row2, map.respondentRelationship),
      city: cell(row2, map.city),
      pincode: cell(row2, map.pincode),
      houseNo: cell(row2, map.houseNo),
      streetName: cell(row2, map.streetName),
      locality: cell(row2, map.locality),
      colony: cell(row2, map.colony),
      presentHouseNo: null,
      presentStreetName: null,
      presentLocality: null,
      presentColony: null,
      presentCity: null,
      presentPincode: null,
      isSameAsProperty: null,
      taxRateZone: cell(row2, map.taxRateZone),
      propertyOwnership: cell(row2, map.propertyOwnership),
      propertyType: null,
      propertyUse: cell(row2, map.propertyUse),
      commercial: cell(row2, map.commercial),
      yearOfConstruction: cell(row2, map.yearOfConstruction),
      exemptionType: null,
      exemptionApplicable: null,
      situation: cell(row2, map.situation),
      roadType: cell(row2, map.roadType),
      floorsRaw: cell(row2, map.floorsRaw),
      plotAreaSqFt: null,
      plotAreaSqMeter: null,
      plinthAreaSqFt: null,
      plinthAreaSqMeter: null,
      totalBuiltUpAreaSqFt: null,
      totalBuiltUpAreaSqMeter: null,
      hasMunicipalWaterSupply:
        parseBool(cell(row2, map.hasMunicipalWaterSupply)) ?? null,
      hasAlternateWater: parseBool(cell(row2, map.hasAlternateWater)) ?? null,
      waterSourceType: cell(row2, map.waterSourceType),
      totalWaterConnections: null,
      waterConnectionIdType: cell(row2, map.waterConnectionIdType),
      toiletType: cell(row2, map.toiletType),
      hasMunicipalWasteService:
        parseBool(cell(row2, map.hasMunicipalWasteService)) ?? null,
      ward: { name: cell(row2, map.wardName), number: 1 },
    }

    const exported = surveyToExcelRow(survey, "chhata-v1-38")

    expect(exported[map.surveyId]).toBe(cell(row2, map.surveyId))
    expect(exported[map.ownerName]).toBe("Vijay singh")
    expect(exported[map.surveyedAt]).toBe(cell(row2, map.surveyedAt))
    expect(exported[map.hasAlternateWater!]).toBe("Yes")
    expect(exported[map.waterSourceType!]).toBe("Dug well")
    expect(exported[map.toiletType]).toBe("Connected to specific tank")
  })

  it("builds workbook with Survey Data sheet name", async () => {
    const workbook = buildSurveyExportWorkbook([], "chhata-v1-38")
    expect(workbook.worksheets[0]?.name).toBe(SURVEY_EXPORT_SHEET_NAME)
    expect(workbook.worksheets[0]?.rowCount).toBe(1)
  })
})

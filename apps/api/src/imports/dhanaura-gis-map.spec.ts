import { readFileSync } from "node:fs"
import { join } from "node:path"

import ExcelJS from "exceljs"

import { extractWardNumber } from "./column-maps"
import {
  DHANAURA_HEADERS,
  DHANAURA_IMPORT_LAYOUT,
  buildDhanauraColumnMap,
  decideDhanauraMatch,
  decideImportedTaxRateZone,
  findHeaderRow,
  gisUseFromPropertyType,
  isDhanauraHeaders,
  missingDhanauraRequired,
  parseDhanauraRow,
  readCellDisplay,
  resolveWorkbookLayout,
  surveyIdForHouse,
} from "./dhanaura-gis-map"
import { importResultStatus } from "./imports.service"
import {
  buildSurveyExportWorkbook,
  detectExportPreset,
  getExportHeaders,
} from "./survey-excel-export"

function gisWorkbook(
  rows: string[][],
  headers: readonly string[] = DHANAURA_HEADERS
) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Sheet1")
  sheet.addRow(["धनौरा वार्ड 1 GIS डाटा"])
  sheet.mergeCells(1, 1, 1, headers.length)
  sheet.addRow([...headers])
  for (const row of rows) sheet.addRow(row)
  workbook.addWorksheet("Sheet2")
  workbook.addWorksheet("Sheet3")
  return workbook
}

function blankGisRow(): string[] {
  return Array.from({ length: DHANAURA_HEADERS.length }, () => "")
}

function sampleGisRow(overrides?: Partial<Record<number, string>>): string[] {
  const row = blankGisRow()
  row[0] = "1"
  row[1] = "पुराना-12"
  row[2] = "12"
  row[3] = "राम लाल"
  row[4] = "श्याम लाल"
  row[5] = "सीता देवी"
  row[6] = "मोहन लाल"
  row[7] = "09876543210"
  row[8] = "निवास"
  row[9] = "आवासीय"
  row[10] = "पक्का"
  row[11] = "1200"
  row[12] = "100"
  row[16] = "1998"
  row[19] = "0"
  row[20] = "400"
  row[27] = "हाँ"
  row[29] = "पक्की सड़क"
  row[32] = "1"
  row[33] = "गांधी नगर"
  if (overrides) {
    for (const [index, value] of Object.entries(overrides)) {
      row[Number(index)] = value ?? ""
    }
  }
  return row
}

describe("dhanaura GIS workbook layout", () => {
  it("finds the Hindi header under a title row and ignores empty sheets", () => {
    const workbook = gisWorkbook([sampleGisRow()])
    const layout = resolveWorkbookLayout(workbook)
    expect(layout?.sheet.name).toBe("Sheet1")
    expect(layout?.headerRowNumber).toBe(2)
    expect(layout?.preset).toBe("dhanaura-gis")
    expect(layout?.dhanauraMap?.ownerName).toBe(5)
    expect(layout?.dhanauraMap?.ownerFatherName).toBe(6)
    expect(layout?.dhanauraMap?.previousOwnerFatherName).toBe(4)
    expect(layout?.storedExtraFields).toContain("previousOwnerName")

    const empty = new ExcelJS.Workbook()
    empty.addWorksheet("Sheet1")
    empty.addWorksheet("Sheet2")
    expect(resolveWorkbookLayout(empty)).toBeNull()
  })

  it("reports a missing ward column and unknown headers", () => {
    const headers = DHANAURA_HEADERS.filter((header) => header !== "वार्ड न०")
    headers.push("अतिरिक्त टिप्पणी")
    const map = buildDhanauraColumnMap([...headers])
    expect(missingDhanauraRequired(map)).toContain("वार्ड न०")
    const layout = resolveWorkbookLayout(gisWorkbook([blankGisRow()], headers))
    expect(layout?.missingRequired).toContain("वार्ड न०")
    expect(layout?.unmappedColumns).toContain("अतिरिक्त टिप्पणी")
  })

  it("keeps Chhata and Mainpuri headers on their own presets", () => {
    const chhata = [
      "Survey Id",
      "Date of Survey",
      "Owner Name",
      "Owner Father Name",
      "Mobile No",
      "Ward Name",
      "Parcel No",
      "Property No",
    ]
    expect(isDhanauraHeaders(chhata)).toBe(false)
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet("Survey Data")
    sheet.addRow(["Municipal export"])
    sheet.addRow(chhata)
    sheet.addRow([
      "249044-001-000001-001-R",
      "",
      "A",
      "B",
      "9876543210",
      "Ward 1",
      "1",
      "1",
    ])
    const layout = resolveWorkbookLayout(workbook)
    expect(layout?.headerRowNumber).toBe(2)
    expect(layout?.preset).toBe("chhata-v1-38")
    expect(detectExportPreset(1)).toBe("mainpuri-v1-41")
  })

  it("maps English GIS aliases without treating them as Mainpuri", () => {
    const headers = [
      "Serial Number",
      "Old House Number",
      "New House Number",
      "Previous Property Owner",
      "Father/Husband Name",
      "Current Property Owner",
      "Father/Husband Name",
      "Mobile Number",
      "Ward Number",
      "Mohalla",
    ]
    expect(isDhanauraHeaders(headers)).toBe(true)
    const found = findHeaderRow([headers])
    expect(found?.dhanaura).toBe(true)
    const map = buildDhanauraColumnMap(headers)
    expect(map.oldHouseNo).toBe(1)
    expect(map.newHouseNo).toBe(2)
    expect(map.ownerName).toBe(5)
    expect(map.ownerFatherName).toBe(6)
    expect(map.previousOwnerName).toBe(3)
    expect(map.previousOwnerFatherName).toBe(4)
    expect(map.wardNumber).toBe(8)
    expect(map.locality).toBe(9)
  })

  it("parses Hindi data, blank rows, and string identifiers", () => {
    const map = buildDhanauraColumnMap([...DHANAURA_HEADERS])
    const blank = parseDhanauraRow(blankGisRow(), map)
    expect(blank.empty).toBe(true)
    expect(blank.errors).toHaveLength(0)

    const partial = parseDhanauraRow(sampleGisRow({ 2: "", 1: "" }), map)
    expect(partial.empty).toBe(false)
    expect(partial.newHouseNo).toBe("")
    expect(partial.houseKey).toBe("")
    expect(partial.errors.some((error) => error.field === "newHouseNo")).toBe(
      true
    )

    const oldHouseOnly = parseDhanauraRow(
      sampleGisRow({ 0: "9", 1: "125", 2: "" }),
      map
    )
    expect(oldHouseOnly.oldHouseNo).toBe("125")
    expect(oldHouseOnly.houseKey).toBe("")
    expect(oldHouseOnly.newHouseNo).toBe("")
    expect(
      oldHouseOnly.errors.some(
        (error) =>
          error.field === "newHouseNo" && error.message.includes("नया म०न०")
      )
    ).toBe(true)

    const parsed = parseDhanauraRow(sampleGisRow(), map)
    expect(parsed.errors).toEqual([])
    expect(parsed.ownerName).toBe("सीता देवी")
    expect(parsed.ownerFatherName).toBe("मोहन लाल")
    expect(parsed.sourceExtras.previousOwnerName).toBe("राम लाल")
    expect(parsed.sourceExtras.previousOwnerFatherName).toBe("श्याम लाल")
    expect(parsed.ownerName).not.toBe(parsed.ownerFatherName)
    expect(parsed.ownerName).not.toBe(parsed.sourceExtras.previousOwnerName)
    expect(parsed.locality).toBe("गांधी नगर")
    expect(parsed.mobile).toBe("09876543210")
    expect(parsed.newHouseNo).toBe("12")
    expect(parsed.oldHouseNo).toBe("पुराना-12")
    expect(parsed.wardNumber).toBe(1)
    expect(
      parsed.floors.map((floor) => [floor.floorLabel, floor.areaSqFt])
    ).toEqual([
      ["Basement", 0],
      ["Ground Floor", 400],
    ])
    expect(parsed.floors[0]?.buildingType).toBe("पक्का")
    expect(parsed.hasMunicipalWaterSupply).toBe(true)
    expect(parsed.sourceExtras.previousOwnerName).toBe("राम लाल")
    expect(parsed.sourceExtras.previousOwnerFatherName).toBe("श्याम लाल")
    expect(parsed.sourceExtras.importLayout).toBe("dhanaura-gis")
    expect(extractWardNumber("1", "")).toBe(1)
    expect(extractWardNumber("0", "")).toBeNull()
  })

  it("binds each father column to the owner header in front of it", () => {
    const reordered = buildDhanauraColumnMap([
      "नया मकान मालिक",
      "पिता/पति का नाम",
      "पुराना मकान मालिक",
      "पिता/पति का नाम",
    ])
    expect(reordered.ownerName).toBe(0)
    expect(reordered.ownerFatherName).toBe(1)
    expect(reordered.previousOwnerName).toBe(2)
    expect(reordered.previousOwnerFatherName).toBe(3)

    const orphanFather = buildDhanauraColumnMap([
      "पिता/पति का नाम",
      "नया मकान मालिक",
      "पिता/पति का नाम",
    ])
    expect(orphanFather.ownerFatherName).toBe(2)
    expect(orphanFather.previousOwnerFatherName).toBe(-1)
  })

  it("builds the parcel from the new house number and keeps leading zeros", () => {
    const map = buildDhanauraColumnMap([...DHANAURA_HEADERS])
    const parsed = parseDhanauraRow(
      sampleGisRow({ 0: "7", 1: "125", 2: "00042" }),
      map
    )
    expect(parsed.errors).toEqual([])
    expect(parsed.newHouseNo).toBe("00042")
    expect(parsed.oldHouseNo).toBe("125")
    expect(parsed.houseKey).toBe("00042")
    const identity = surveyIdForHouse({
      ulbCode: "249044",
      wardNumber: 1,
      houseKey: parsed.houseKey,
      propertyType: "आवासीय",
    })
    expect(identity.parcelNo).toBe("000042")
    expect(identity.surveyId).toBe("249044-001-000042-001-R")
    expect(identity.parcelNo).not.toBe("125")
    expect(identity.parcelNo).not.toBe("000007")

    const headers = DHANAURA_HEADERS.filter((header) => header !== "नया म०न०")
    expect(
      missingDhanauraRequired(buildDhanauraColumnMap([...headers]))
    ).toContain("नया म०न०")

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet("Sheet1")
    const row = sheet.addRow([null, null, 42])
    const cell = row.getCell(3)
    cell.value = 42
    cell.numFmt = "00000"
    expect(readCellDisplay(cell)).toBe("00042")
  })

  it("assigns a tax road zone from road width and keeps a saved zone", () => {
    const map = buildDhanauraColumnMap([...DHANAURA_HEADERS])
    const parsed = parseDhanauraRow(sampleGisRow({ 28: "8" }), map)
    expect(parsed.roadWidthMeters).toBe("8")
    expect(parsed.taxRateZone).toBe("RATE ZONE 1 (Upto 9 Meters)")
    expect(parsed.sourceExtras.roadWidthMeters).toBe("8")
    expect(parsed.roadType).toBe("पक्की सड़क")

    expect(
      decideImportedTaxRateZone({ roadWidth: "8", existingTaxRateZone: null })
    ).toEqual({
      kind: "set",
      taxRateZone: "RATE ZONE 1 (Upto 9 Meters)",
    })
    expect(
      decideImportedTaxRateZone({
        roadWidth: "abc",
        existingTaxRateZone: "RATE ZONE 3 (12 Meters And Upto 24 Meters)",
      })
    ).toEqual({
      kind: "keep",
      warning:
        "Road width could not be resolved to a tax road zone; existing tax road zone was kept",
    })
    expect(
      decideImportedTaxRateZone({
        roadWidth: "30",
        existingTaxRateZone: "RATE ZONE 1 (Upto 9 Meters)",
      }).kind
    ).toBe("keep")
    expect(
      decideImportedTaxRateZone({ roadWidth: "", existingTaxRateZone: null })
        .kind
    ).toBe("error")
    expect(
      decideDhanauraMatch({
        matches: [
          {
            id: "manual",
            presentHouseNo: "00042",
            houseNo: "125",
            surveyId: "249044-001-000042-001-R",
            parcelNo: "000099",
          },
        ],
        surveyIdHit: null,
        houseKey: "00042",
        usesNewHouse: true,
        parcelNo: "000042",
      })
    ).toEqual({ kind: "existing", id: "manual", replaceSurveyId: false })
  })

  it("builds a survey id from the house number and refuses ambiguous matches", () => {
    const first = surveyIdForHouse({
      ulbCode: "249044",
      wardNumber: 1,
      houseKey: "1",
      propertyType: "Residential",
    })
    expect(first).toEqual({
      surveyId: "249044-001-000001-001-R",
      parcelNo: "000001",
      propertyNo: "001",
      gisUseCode: "R",
      gisUseRecognized: true,
    })
    expect(
      surveyIdForHouse({
        ulbCode: "249044",
        wardNumber: 1,
        houseKey: "001",
        propertyType: "आवासीय",
      }).surveyId
    ).toBe(first.surveyId)
    expect(
      surveyIdForHouse({
        ulbCode: "249044",
        wardNumber: 7,
        houseKey: "12",
        propertyType: "Commercial",
      }).surveyId
    ).toBe("249044-007-000012-001-C")
    expect(gisUseFromPropertyType("").recognized).toBe(false)
    expect(gisUseFromPropertyType("दुकान").letter).toBe("R")
    expect(() =>
      surveyIdForHouse({
        ulbCode: "249044",
        wardNumber: 1,
        houseKey: "12अ",
      })
    ).toThrow(/numeric/)

    const map = buildDhanauraColumnMap([...DHANAURA_HEADERS])
    const nonNumeric = parseDhanauraRow(sampleGisRow({ 2: "12अ" }), map)
    expect(
      nonNumeric.errors.some((error) => error.field === "newHouseNo")
    ).toBe(true)

    expect(
      decideDhanauraMatch({
        matches: [],
        surveyIdHit: null,
        houseKey: "12",
        usesNewHouse: true,
        parcelNo: "000012",
      }).kind
    ).toBe("create")

    expect(
      decideDhanauraMatch({
        matches: [
          {
            id: "s1",
            presentHouseNo: "12",
            houseNo: "पुराना-12",
            importLayout: DHANAURA_IMPORT_LAYOUT,
          },
        ],
        surveyIdHit: null,
        houseKey: "12",
        usesNewHouse: true,
        parcelNo: "000012",
      })
    ).toEqual({ kind: "existing", id: "s1", replaceSurveyId: true })

    expect(
      decideDhanauraMatch({
        matches: [{ id: "s1", presentHouseNo: "12", houseNo: null }],
        surveyIdHit: null,
        houseKey: "12",
        usesNewHouse: true,
      })
    ).toEqual({ kind: "existing", id: "s1", replaceSurveyId: false })

    expect(
      decideDhanauraMatch({
        matches: [
          {
            id: "kept",
            presentHouseNo: "12",
            houseNo: null,
            surveyId: "249044-001-000099-001-R",
            parcelNo: "000099",
          },
        ],
        surveyIdHit: null,
        houseKey: "12",
        usesNewHouse: true,
        parcelNo: "000012",
      }).kind
    ).toBe("error")

    expect(
      decideDhanauraMatch({
        matches: [
          { id: "s1", presentHouseNo: "12", houseNo: null },
          { id: "s2", presentHouseNo: "12", houseNo: null },
        ],
        surveyIdHit: null,
        houseKey: "12",
        usesNewHouse: true,
      }).kind
    ).toBe("error")

    const collision = decideDhanauraMatch({
      matches: [],
      surveyIdHit: { id: "other", presentHouseNo: "99", houseNo: null },
      houseKey: "12",
      usesNewHouse: true,
    })
    expect(collision.kind).toBe("error")
  })

  it("does not report success when nothing was saved", () => {
    expect(importResultStatus(0, 0)).toBe("FAILED")
    expect(importResultStatus(2, 0)).toBe("COMPLETED")
    expect(importResultStatus(1, 1)).toBe("PARTIAL")
  })

  it("keeps dhanaura updates inside a transaction so a failure rolls back", () => {
    const src = readFileSync(join(__dirname, "imports.service.ts"), "utf8")
    const start = src.indexOf("private async processDhanauraJob")
    const slice = src.slice(start, src.indexOf("private async failJob"))
    expect(slice).toContain("this.prisma.$transaction")
    expect(slice).toContain("tx.survey.create")
    expect(slice).toContain("Duplicate house number in this file")
    expect(src).not.toContain("if (!rawSurveyId) continue")
    expect(src).toContain(
      "Survey Id is missing and parcel and property numbers are required"
    )
    expect(slice.indexOf("$transaction")).toBeLessThan(
      slice.indexOf("updated++")
    )
    expect(slice).toContain(
      "message: `Ward not found for ${parsed.wardNumber}`"
    )
  })

  it("still requires import:create before upload", () => {
    const src = readFileSync(join(__dirname, "imports.controller.ts"), "utf8")
    expect(src).toContain('@RequirePermission("import:create")')
    expect(src).toContain('@Post("upload")')
  })

  it("exports Hindi GIS values from the same columns", () => {
    const identity = surveyIdForHouse({
      ulbCode: "249044",
      wardNumber: 1,
      houseKey: "12",
      propertyType: "आवासीय",
    })
    const workbook = buildSurveyExportWorkbook(
      [
        {
          surveyId: identity.surveyId,
          surveyedAt: null,
          ownerName: "सीता देवी",
          ownerFatherName: "मोहन लाल",
          mobile: "09876543210",
          ownerAadhaar: null,
          isSlum: false,
          remark: null,
          parcelNo: identity.parcelNo,
          propertyNo: identity.propertyNo,
          electricityId: null,
          khasraNo: null,
          registryNo: null,
          constructedDate: null,
          respondentName: null,
          respondentRelationship: null,
          city: null,
          pincode: null,
          houseNo: "पुराना-12",
          streetName: null,
          locality: "गांधी नगर",
          colony: null,
          presentHouseNo: "12",
          presentStreetName: null,
          presentLocality: null,
          presentColony: null,
          presentCity: null,
          presentPincode: null,
          isSameAsProperty: null,
          taxRateZone: null,
          propertyOwnership: null,
          propertyType: "आवासीय",
          propertyUse: null,
          commercial: null,
          yearOfConstruction: "1998",
          exemptionType: null,
          exemptionApplicable: null,
          situation: null,
          roadType: "पक्की सड़क",
          floorsRaw: null,
          plotAreaSqFt: null,
          plotAreaSqMeter: null,
          plinthAreaSqFt: null,
          plinthAreaSqMeter: null,
          totalBuiltUpAreaSqFt: null,
          totalBuiltUpAreaSqMeter: null,
          hasMunicipalWaterSupply: true,
          hasAlternateWater: null,
          waterSourceType: "हाँ",
          totalWaterConnections: null,
          waterConnectionIdType: null,
          toiletType: null,
          hasMunicipalWasteService: null,
          ward: { name: "Ward 1", number: 1 },
          sourceExtras: {
            importLayout: "dhanaura-gis",
            serialNo: "1",
            previousOwnerName: "राम लाल",
            propertyTitle: "निवास",
          },
          floors: [
            { floorLabel: "Basement", areaSqFt: 0, buildingType: "पक्का" },
            {
              floorLabel: "Ground Floor",
              areaSqFt: 400,
              buildingType: "पक्का",
            },
          ],
        },
      ],
      "dhanaura-gis"
    )
    const sheet = workbook.getWorksheet("Survey Data")
    expect(getExportHeaders("dhanaura-gis")[0]).toBe("क्रम सं०")
    expect(sheet?.getRow(1).getCell(1).value).toBe("क्रम सं०")
    const exported = sheet?.getRow(2).values
    const cells = Array.isArray(exported) ? exported.slice(1).map(String) : []
    expect(cells[2]).toBe("12")
    expect(cells[5]).toBe("सीता देवी")
    expect(cells[7]).toBe("09876543210")
    expect(cells[19]).toBe("0")
    expect(cells[20]).toBe("400")
    expect(cells[33]).toBe("गांधी नगर")

    const roundTrip = resolveWorkbookLayout(workbook)
    expect(roundTrip?.preset).toBe("dhanaura-gis")
    const parsed = parseDhanauraRow(
      cells,
      roundTrip?.dhanauraMap ?? buildDhanauraColumnMap([...DHANAURA_HEADERS])
    )
    expect(parsed.ownerName).toBe("सीता देवी")
    expect(parsed.locality).toBe("गांधी नगर")
    expect(parsed.mobile).toBe("09876543210")
    expect(parsed.newHouseNo).toBe("12")
  })
})

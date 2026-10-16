/** Column index maps for Chhata Excel layouts (0-based). */

import { wardNumberFromSurveyId } from "@workspace/types"

export type ColumnMap = {
  surveyId: number
  surveyedAt: number
  ownerName: number
  ownerFatherName: number
  mobile: number
  wardName: number
  isSlum: number
  parcelNo: number
  propertyNo: number
  respondentName: number
  respondentRelationship: number
  city: number
  pincode: number
  houseNo: number
  streetName: number
  locality: number
  colony: number
  taxRateZone: number
  propertyOwnership: number
  propertyUse: number
  commercial: number
  yearOfConstruction: number
  situation: number
  roadType: number
  floorsRaw: number
  plotAreaSqFt: number
  plotAreaSqMeter: number
  plinthAreaSqFt: number
  plinthAreaSqMeter: number
  totalBuiltUpAreaSqFt: number
  totalBuiltUpAreaSqMeter: number
  hasMunicipalWaterSupply: number
  totalWaterConnections: number
  waterConnectionIdType: number
  toiletType: number
  hasMunicipalWasteService: number
  /** Mainpuri GIS: high-level type (Residential / Mix / Commercial / Open Land). */
  propertyType?: number
  remark?: number
  electricityId?: number
  khasraNo?: number
  registryNo?: number
  constructedDate?: number
  ownerAadhaar?: number
  presentHouseNo?: number
  presentStreetName?: number
  presentLocality?: number
  presentColony?: number
  presentCity?: number
  presentPincode?: number
  isSameAsProperty?: number
  exemptionType?: number
  exemptionApplicable?: number
  hasAlternateWater?: number
  waterSourceType?: number
  /** Present only on Mainpuri Assessment-Year-first layouts (not read into Survey). */
  assessmentYear?: number
}

/** Ward 1 workbook: 38 cols, starts with Survey Id (no SN / Actions). */
export const CHHATA_V1_38: ColumnMap = {
  surveyId: 0,
  surveyedAt: 1,
  ownerName: 2,
  ownerFatherName: 3,
  mobile: 4,
  wardName: 5,
  isSlum: 6,
  parcelNo: 7,
  propertyNo: 8,
  respondentName: 9,
  respondentRelationship: 10,
  city: 11,
  pincode: 12,
  houseNo: 13,
  streetName: 14,
  locality: 15,
  colony: 16,
  taxRateZone: 17,
  propertyOwnership: 18,
  propertyUse: 19,
  commercial: 20,
  yearOfConstruction: 21,
  situation: 22,
  roadType: 23,
  floorsRaw: 24,
  plotAreaSqFt: 25,
  plotAreaSqMeter: 26,
  plinthAreaSqFt: 27,
  plinthAreaSqMeter: 28,
  totalBuiltUpAreaSqFt: 29,
  totalBuiltUpAreaSqMeter: 30,
  hasMunicipalWaterSupply: 31,
  totalWaterConnections: 32,
  waterConnectionIdType: 33,
  toiletType: 34,
  hasMunicipalWasteService: 35,
  // Trailing headers are duplicated "Is Muncipal Water Supply"; values are yes/no + source.
  hasAlternateWater: 36,
  waterSourceType: 37,
}

/**
 * Ward exports that start with Survey Id but insert Owner Aadhaar after
 * Respondent Relationship (39 cols). Using v1-38 on these shifts Floors → Road Type.
 */
export const CHHATA_V1_39: ColumnMap = {
  surveyId: 0,
  surveyedAt: 1,
  ownerName: 2,
  ownerFatherName: 3,
  mobile: 4,
  wardName: 5,
  isSlum: 6,
  parcelNo: 7,
  propertyNo: 8,
  respondentName: 9,
  respondentRelationship: 10,
  ownerAadhaar: 11,
  city: 12,
  pincode: 13,
  houseNo: 14,
  streetName: 15,
  locality: 16,
  colony: 17,
  taxRateZone: 18,
  propertyOwnership: 19,
  propertyUse: 20,
  commercial: 21,
  yearOfConstruction: 22,
  situation: 23,
  roadType: 24,
  floorsRaw: 25,
  plotAreaSqFt: 26,
  plotAreaSqMeter: 27,
  plinthAreaSqFt: 28,
  plinthAreaSqMeter: 29,
  totalBuiltUpAreaSqFt: 30,
  totalBuiltUpAreaSqMeter: 31,
  hasMunicipalWaterSupply: 32,
  totalWaterConnections: 33,
  waterConnectionIdType: 34,
  toiletType: 35,
  hasMunicipalWasteService: 36,
  hasAlternateWater: 37,
  waterSourceType: 38,
}

/** Ward 2+ workbooks: 55 cols, SN + Actions then Survey Id. */
export const CHHATA_V2_55: ColumnMap = {
  surveyId: 2,
  surveyedAt: 3,
  ownerName: 4,
  ownerFatherName: 5,
  mobile: 6,
  wardName: 7,
  isSlum: 8,
  remark: 9,
  parcelNo: 10,
  propertyNo: 11,
  electricityId: 12,
  khasraNo: 13,
  registryNo: 14,
  constructedDate: 15,
  respondentName: 16,
  respondentRelationship: 17,
  ownerAadhaar: 18,
  city: 19,
  pincode: 20,
  houseNo: 21,
  streetName: 22,
  locality: 23,
  colony: 24,
  presentHouseNo: 25,
  presentStreetName: 26,
  presentLocality: 27,
  presentColony: 28,
  presentCity: 29,
  presentPincode: 30,
  isSameAsProperty: 31,
  taxRateZone: 32,
  propertyOwnership: 33,
  propertyUse: 34,
  commercial: 35,
  yearOfConstruction: 36,
  exemptionType: 37,
  exemptionApplicable: 38,
  situation: 39,
  roadType: 40,
  floorsRaw: 41,
  plotAreaSqFt: 42,
  plotAreaSqMeter: 43,
  plinthAreaSqFt: 44,
  plinthAreaSqMeter: 45,
  totalBuiltUpAreaSqFt: 46,
  totalBuiltUpAreaSqMeter: 47,
  hasMunicipalWaterSupply: 48,
  totalWaterConnections: 49,
  waterConnectionIdType: 50,
  toiletType: 51,
  hasMunicipalWasteService: 52,
}

export type MappingPreset =
  | "chhata-v1-38"
  | "chhata-v1-39"
  | "chhata-v2-55"
  | "mainpuri-v1-41"
  | "dhanaura-gis"

/** ColumnMap used only so callers of getMapping never read shifted neighbors. */
const DHANAURA_GIS_UNUSED: ColumnMap = {
  surveyId: -1,
  surveyedAt: -1,
  ownerName: -1,
  ownerFatherName: -1,
  mobile: -1,
  wardName: -1,
  isSlum: -1,
  parcelNo: -1,
  propertyNo: -1,
  respondentName: -1,
  respondentRelationship: -1,
  city: -1,
  pincode: -1,
  houseNo: -1,
  streetName: -1,
  locality: -1,
  colony: -1,
  taxRateZone: -1,
  propertyOwnership: -1,
  propertyUse: -1,
  commercial: -1,
  yearOfConstruction: -1,
  situation: -1,
  roadType: -1,
  floorsRaw: -1,
  plotAreaSqFt: -1,
  plotAreaSqMeter: -1,
  plinthAreaSqFt: -1,
  plinthAreaSqMeter: -1,
  totalBuiltUpAreaSqFt: -1,
  totalBuiltUpAreaSqMeter: -1,
  hasMunicipalWaterSupply: -1,
  totalWaterConnections: -1,
  waterConnectionIdType: -1,
  toiletType: -1,
  hasMunicipalWasteService: -1,
}

const EMPTY_CELL = /^(n\/a|na|null|-|none)$/i

/** Keys set from trailing duplicate water headers — not cleared as "unmatched". */
const WATER_SPECIAL_KEYS = new Set<keyof ColumnMap>([
  "hasAlternateWater",
  "waterSourceType",
])

export function normHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "")
}

/**
 * Exact header tokens → ColumnMap keys (Present* fields use distinct tokens).
 * Multiple tokens may map to the same key (first match wins); aliases listed after
 * primary names (e.g. Property Use before Property Uses).
 */
const HEADER_FIELD_TOKENS: Array<{ key: keyof ColumnMap; token: string }> = [
  { key: "assessmentYear", token: "assessmentyear" },
  { key: "surveyId", token: "surveyid" },
  { key: "surveyedAt", token: "dateofsurvey" },
  { key: "ownerName", token: "ownername" },
  { key: "ownerFatherName", token: "ownerfathername" },
  { key: "mobile", token: "mobileno" },
  { key: "wardName", token: "wardname" },
  { key: "isSlum", token: "isslum" },
  { key: "remark", token: "remark" },
  { key: "parcelNo", token: "parcelno" },
  { key: "propertyNo", token: "propertyno" },
  { key: "electricityId", token: "electricityid" },
  { key: "khasraNo", token: "khasrano" },
  { key: "registryNo", token: "registryno" },
  { key: "constructedDate", token: "constructeddate" },
  { key: "respondentName", token: "respondentname" },
  { key: "respondentRelationship", token: "respondentrelationship" },
  { key: "ownerAadhaar", token: "owneraadhaarnumber" },
  { key: "city", token: "city" },
  { key: "pincode", token: "pincode" },
  { key: "houseNo", token: "houseno" },
  { key: "streetName", token: "streetname" },
  { key: "locality", token: "locality" },
  { key: "colony", token: "colony" },
  { key: "presentHouseNo", token: "presenthouseno" },
  { key: "presentStreetName", token: "presentstreetname" },
  { key: "presentLocality", token: "presentlocality" },
  { key: "presentColony", token: "presentcolony" },
  { key: "presentCity", token: "presentcity" },
  { key: "presentPincode", token: "presentpincode" },
  { key: "isSameAsProperty", token: "issameasproperty" },
  { key: "taxRateZone", token: "taxratezone" },
  { key: "propertyOwnership", token: "propertyownership" },
  { key: "propertyType", token: "propertytype" },
  { key: "propertyUse", token: "propertyuse" },
  { key: "propertyUse", token: "propertyuses" },
  { key: "commercial", token: "commercial" },
  { key: "yearOfConstruction", token: "yearofconstruction" },
  { key: "exemptionType", token: "exemptiontype" },
  { key: "exemptionApplicable", token: "exemptionapplicable" },
  { key: "situation", token: "situation" },
  { key: "roadType", token: "roadtype" },
  { key: "floorsRaw", token: "floors" },
  { key: "plotAreaSqFt", token: "plotareasqft" },
  { key: "plotAreaSqMeter", token: "plotareasqmeter" },
  { key: "plinthAreaSqFt", token: "plinthareasqft" },
  { key: "plinthAreaSqMeter", token: "plinthareasqmeter" },
  { key: "totalBuiltUpAreaSqFt", token: "totalbuiltupareasqft" },
  { key: "totalBuiltUpAreaSqMeter", token: "totalbuiltupareasqmeter" },
  { key: "hasMunicipalWaterSupply", token: "ismuncipalwatersupply" },
  { key: "totalWaterConnections", token: "totalwaterconnection" },
  { key: "waterConnectionIdType", token: "waterconnectionidtype" },
  { key: "toiletType", token: "toilettype" },
  { key: "hasMunicipalWasteService", token: "ismuncipalwasteservice" },
]

const HEADER_TOKEN_KEYS = new Set<keyof ColumnMap>(
  HEADER_FIELD_TOKENS.map((t) => t.key)
)

const ENGLISH_HEADER_TOKEN_SET = new Set(
  HEADER_FIELD_TOKENS.map((entry) => entry.token)
)

/** How many distinct English survey headers this row contains. */
export function countEnglishHeaderMatches(headers: string[]): number {
  const seen = new Set<string>()
  let count = 0
  for (const header of headers) {
    const token = normHeader(header ?? "")
    if (!token || seen.has(token) || !ENGLISH_HEADER_TOKEN_SET.has(token)) {
      continue
    }
    seen.add(token)
    count++
  }
  return count
}

/**
 * Override preset indexes using actual header row labels.
 * Prevents Floors/areas/zone corruption when Excel variants insert columns.
 * Unmatched token keys that existed on the preset are set to -1 so `cell()`
 * returns empty instead of reading a shifted neighbor column.
 */
export function refineMappingFromHeaders(
  base: ColumnMap,
  headers: string[]
): ColumnMap {
  const refined: ColumnMap = { ...base }
  const normalized = headers.map((h) => normHeader(h ?? ""))
  const matched = new Set<keyof ColumnMap>()

  for (const { key, token } of HEADER_FIELD_TOKENS) {
    if (matched.has(key)) continue
    const idx = normalized.findIndex((h) => h === token)
    if (idx >= 0) {
      refined[key] = idx as never
      matched.add(key)
    }
  }

  // Trailing duplicate "Is Muncipal Water Supply" → alternate water fields (v1 layouts).
  const waterSupplyIdxs = normalized
    .map((h, i) => (h === "ismuncipalwatersupply" ? i : -1))
    .filter((i) => i >= 0)
  if (waterSupplyIdxs.length >= 2 && waterSupplyIdxs[1] != null) {
    refined.hasAlternateWater = waterSupplyIdxs[1]
    matched.add("hasAlternateWater")
  }
  if (waterSupplyIdxs.length >= 3 && waterSupplyIdxs[2] != null) {
    refined.waterSourceType = waterSupplyIdxs[2]
    matched.add("waterSourceType")
  }

  for (const key of HEADER_TOKEN_KEYS) {
    if (matched.has(key) || WATER_SPECIAL_KEYS.has(key)) continue
    if (Object.prototype.hasOwnProperty.call(refined, key)) {
      refined[key] = -1 as never
    }
  }

  return refined
}

export function detectPreset(columnCount: number): MappingPreset {
  return columnCount >= 50 ? "chhata-v2-55" : "chhata-v1-38"
}

export function detectPresetFromHeaders(
  headers: string[],
  columnCount = headers.length
): MappingPreset {
  const first = (headers[0] ?? "").toLowerCase().replace(/[.\s]/g, "")
  if (first === "sn" || first === "sno") return "chhata-v2-55"
  // Mainpuri GIS: Assessment Year first, Property Type + Property Uses (no Commercial).
  if (first === "assessmentyear") return "mainpuri-v1-41"
  const normalized = headers.map((h) => normHeader(h ?? ""))
  if (
    normalized.includes("propertyuses") ||
    normalized.includes("propertytype")
  ) {
    return "mainpuri-v1-41"
  }
  if (first.includes("surveyid")) {
    const hasAadhaar = headers.some((h) => /aadhaar/i.test(h ?? ""))
    const floorsIdx = headers.findIndex((h) => normHeader(h ?? "") === "floors")
    // Survey-Id-first sheets with Owner Aadhaar (or Floors at col 26) use v1-39.
    if (hasAadhaar || floorsIdx === 25) return "chhata-v1-39"
    return "chhata-v1-38"
  }
  return detectPreset(columnCount)
}

/** Mainpuri Ward 01 layout indexes (0-based) — Assessment Year first. */
export const MAINPURI_V1_41: ColumnMap = {
  assessmentYear: 0,
  surveyId: 1,
  surveyedAt: 2,
  ownerName: 3,
  ownerFatherName: 4,
  mobile: 5,
  wardName: 6,
  isSlum: 7,
  remark: 8,
  parcelNo: 9,
  propertyNo: 10,
  respondentName: 11,
  respondentRelationship: 12,
  city: 13,
  pincode: 14,
  isSameAsProperty: 15,
  houseNo: 16,
  streetName: 17,
  locality: 18,
  colony: 19,
  taxRateZone: 20,
  propertyOwnership: 21,
  propertyType: 22,
  propertyUse: 23,
  commercial: -1,
  yearOfConstruction: 24,
  situation: 25,
  roadType: 26,
  floorsRaw: 27,
  plotAreaSqFt: 28,
  plotAreaSqMeter: 29,
  plinthAreaSqFt: 30,
  plinthAreaSqMeter: 31,
  totalBuiltUpAreaSqFt: 32,
  totalBuiltUpAreaSqMeter: 33,
  hasMunicipalWaterSupply: 34,
  totalWaterConnections: 35,
  waterConnectionIdType: 36,
  toiletType: 37,
  hasMunicipalWasteService: 38,
  hasAlternateWater: 39,
  waterSourceType: 40,
}

export function getMapping(preset: MappingPreset): ColumnMap {
  if (preset === "dhanaura-gis") return DHANAURA_GIS_UNUSED
  if (preset === "chhata-v2-55") return CHHATA_V2_55
  if (preset === "chhata-v1-39") return CHHATA_V1_39
  if (preset === "mainpuri-v1-41") return MAINPURI_V1_41
  return CHHATA_V1_38
}

/** Detect preset then align indexes to the real header row. */
export function resolveColumnMap(
  headers: string[],
  columnCount = headers.length
): { preset: MappingPreset; map: ColumnMap } {
  const preset = detectPresetFromHeaders(headers, columnCount)
  return { preset, map: refineMappingFromHeaders(getMapping(preset), headers) }
}

export function excelValueToString(value: unknown): string {
  if (value == null) return ""
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return ""
    return String(value)
  }
  if (typeof value === "boolean") return value ? "true" : "false"
  if (typeof value === "string") return value.trim()
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>
    if (typeof obj.text === "string") return obj.text.trim()
    if ("result" in obj) return excelValueToString(obj.result)
    if (Array.isArray(obj.richText)) {
      return obj.richText
        .map((part) =>
          typeof part === "object" && part && "text" in part
            ? String((part as { text?: unknown }).text ?? "")
            : ""
        )
        .join("")
        .trim()
    }
  }
  return String(value).trim()
}

export function cell(row: unknown[], index?: number): string {
  if (index == null || index < 0) return ""
  const text = excelValueToString(row[index])
  if (!text || EMPTY_CELL.test(text)) return ""
  return text
}

export function parseBool(value: string): boolean | undefined {
  const v = value.toLowerCase()
  if (!v || EMPTY_CELL.test(v)) return undefined
  if (["y", "yes", "true", "1"].includes(v)) return true
  if (["n", "no", "false", "0"].includes(v)) return false
  return undefined
}

export function parseNumber(value: string): number | undefined {
  if (!value || EMPTY_CELL.test(value.toLowerCase())) return undefined
  const n = Number(String(value).replace(/,/g, ""))
  return Number.isFinite(n) ? n : undefined
}

export function parseSurveyedAt(value: string): Date | undefined {
  if (!value) return undefined
  const normalized = value.replace(/\s+at\s+/i, " ")
  const d = new Date(normalized)
  return Number.isNaN(d.getTime()) ? undefined : d
}

const DEVANAGARI_DIGITS = "०१२३४५६७८९"

function foldDevanagariDigits(value: string): string {
  return value.replace(/[०-९]/g, (ch) => {
    const index = DEVANAGARI_DIGITS.indexOf(ch)
    return index >= 0 ? String(index) : ch
  })
}

export function extractWardNumber(
  wardName: string,
  surveyId: string
): number | null {
  const trimmed = foldDevanagariDigits(wardName).trim()
  if (/^\d+$/.test(trimmed)) {
    const plain = Number(trimmed)
    return Number.isFinite(plain) && plain > 0 ? plain : null
  }
  // Abbreviation zeros (नं0, न0, सं0) are not the ward number.
  const fromName = trimmed.match(
    /वार्ड\s*(?:नंबर|संख्या|नं\s*0|न0|नं\.?|सं\s*0)?\s*(\d+)|ward\s*(?:no\.?|number)?\s*(\d+)/i
  )
  if (fromName) {
    const n = Number(fromName[1] ?? fromName[2])
    return Number.isFinite(n) && n > 0 ? n : null
  }
  const fromId = wardNumberFromSurveyId(surveyId)
  if (fromId != null) return fromId
  return null
}

export {
  normalizeParcelNoFromExcel as normalizeParcelNo,
  normalizePropertyNoFromExcel as normalizePropertyNo,
  parcelFromSurveyId,
  propertyFromSurveyId,
} from "@workspace/types"

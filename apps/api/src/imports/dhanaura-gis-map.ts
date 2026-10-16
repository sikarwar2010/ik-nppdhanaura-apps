import {
  generateSurveyId,
  normalizeParcelNo,
  normalizePropertyNo,
  parseGisSurveyId,
} from "@workspace/types"
import ExcelJS from "exceljs"

import { taxRateZoneLabelFromRoadWidth } from "../tax/tax-zone-map"

import {
  countEnglishHeaderMatches,
  excelValueToString,
  extractWardNumber,
  parseBool,
  parseNumber,
  resolveColumnMap,
  type ColumnMap,
  type MappingPreset,
} from "./column-maps"
import {
  isLegacyHindiFont,
  krutiDevToUnicode,
  looksLikeKrutiDev,
} from "./kruti-dev"

export const DHANAURA_IMPORT_LAYOUT = "dhanaura-gis"
export const HEADER_SCAN_LIMIT = 20
export const MIN_HEADER_SCORE = 4

export const DHANAURA_FLOOR_LABELS = {
  basement: "Basement",
  ground: "Ground Floor",
  first: "First Floor",
  second: "Second Floor",
  third: "Third Floor",
} as const

const DEVANAGARI_DIGITS = "०१२३४५६७८९"

export const DHANAURA_HEADERS = [
  "क्रम सं०",
  "पुराना म०न०",
  "नया म०न०",
  "पुराना मकान मालिक",
  "पिता/पति का नाम",
  "नया मकान मालिक",
  "पिता/पति का नाम",
  "मोबाईल न०",
  "सम्पत्ति शीर्षक",
  "सम्पत्ति का प्रकार",
  "मकान की प्रकृति",
  "सम्पत्ति का कुल क्षेत्रफल",
  "खाली प्लाट का क्षेत्रफल",
  "सम्पत्ति क्षेत्र चौड़ाई",
  "सम्पत्ति क्षेत्र लम्बाई",
  "मकान निर्माण क्षेत्रफल वर्गफुट",
  "निर्माण वर्ष",
  "कमरों की संख्या",
  "मंजिलों की संख्या",
  "भूमिगत क्षेत्रफल वर्गफुट",
  "तल मंजिल",
  "प्रथम मंजिल",
  "दूसरी मंजिल",
  "दुकान का क्षेत्रफल वर्गफुट",
  "दुकान संख्या",
  "दुकान का नाम",
  "किरायदार का नाम",
  "जल आपूर्ति",
  "सड़क चौड़ाई मी०",
  "सड़क का प्रकार",
  "अन्य/करदाता",
  "फैमिली मेम्बर",
  "वार्ड न०",
  "मौहल्ला",
] as const

export type DhanauraField = (typeof DHANAURA_FIELD_ORDER)[number]

const DHANAURA_FIELD_ORDER = [
  "serialNo",
  "oldHouseNo",
  "newHouseNo",
  "previousOwnerName",
  "previousOwnerFatherName",
  "ownerName",
  "ownerFatherName",
  "mobile",
  "propertyTitle",
  "propertyType",
  "buildingType",
  "plotAreaSqFt",
  "vacantPlotArea",
  "propertyWidth",
  "propertyLength",
  "totalBuiltUpAreaSqFt",
  "yearOfConstruction",
  "roomCount",
  "floorCount",
  "basementArea",
  "groundFloorArea",
  "firstFloorArea",
  "secondFloorArea",
  "thirdFloorArea",
  "shopAreaSqFt",
  "shopNumber",
  "shopName",
  "tenantName",
  "waterSupply",
  "roadWidthMeters",
  "roadType",
  "taxpayerInfo",
  "familyMemberCount",
  "wardNumber",
  "locality",
] as const

export type DhanauraColumnMap = Record<DhanauraField, number>

/** Fields kept on Survey.sourceExtras instead of first-class columns. */
export const DHANAURA_EXTRA_FIELDS = [
  "serialNo",
  "previousOwnerName",
  "previousOwnerFatherName",
  "propertyTitle",
  "vacantPlotArea",
  "propertyWidth",
  "propertyLength",
  "roomCount",
  "floorCount",
  "shopAreaSqFt",
  "shopNumber",
  "shopName",
  "tenantName",
  "roadWidthMeters",
  "taxpayerInfo",
  "familyMemberCount",
] as const

export type DhanauraExtraField = (typeof DHANAURA_EXTRA_FIELDS)[number]

type Alias = {
  field: DhanauraField
  exact: string[]
  /** Hindi or GIS-only labels. Generic Chhata/Mainpuri tokens are not specific. */
  specific: boolean
}

/** Owner label without पुराना/नया — resolved after other owner columns are known. */
const AMBIGUOUS_OWNER_EXACT = new Set(["मकानमालिककानाम"])

const ALIASES: Alias[] = [
  {
    field: "serialNo",
    exact: ["क्रमसं0", "क्रमसं", "क्र0सं0", "serialnumber", "serialno"],
    specific: true,
  },
  {
    field: "oldHouseNo",
    exact: [
      "पुरानाम0न0",
      "पुरानाम0नं0",
      "पुरानामकाननंबर",
      "oldhousenumber",
      "oldhouseno",
    ],
    specific: true,
  },
  {
    field: "newHouseNo",
    exact: ["नयाम0न0", "नयामकाननंबर", "newhousenumber", "newhouseno"],
    specific: true,
  },
  {
    field: "previousOwnerName",
    exact: ["पुरानामकानमालिक", "previouspropertyowner", "previousowner"],
    specific: true,
  },
  {
    field: "ownerName",
    exact: [
      "नयामकानमालिक",
      "नयेमकानमालिककानाम",
      "currentpropertyowner",
      "currentowner",
    ],
    specific: true,
  },
  {
    field: "mobile",
    exact: [
      "मोबाईलन0",
      "मोबाइलन0",
      "मोबाईलनं0",
      "मोबाइलनं0",
      "mobilenumber",
      "mobileno",
    ],
    specific: false,
  },
  {
    field: "propertyTitle",
    exact: ["सम्पत्तिशीर्षक", "संपत्तिशीर्षक", "propertytitle"],
    specific: true,
  },
  {
    field: "propertyType",
    exact: ["सम्पत्तिकाप्रकार", "संपत्तिकाप्रकार", "propertytype"],
    specific: false,
  },
  {
    field: "buildingType",
    exact: [
      "मकानकीप्रकृति",
      "सम्पत्तिकीप्रकृति",
      "संपत्तिकीप्रकृति",
      "buildingtype",
      "constructiontype",
    ],
    specific: true,
  },
  {
    field: "plotAreaSqFt",
    exact: [
      "सम्पत्तिकाकुलक्षेत्रफल",
      "संपत्तिकाकुलक्षेत्रफल",
      "totalpropertyarea",
    ],
    specific: true,
  },
  {
    field: "vacantPlotArea",
    exact: [
      "खालीप्लाटकाक्षेत्रफल",
      "खालीप्लाटक्षेत्रफल",
      "खालीप्लाटक्षे0",
      "खालीप्लाटकाक्षेत्र0",
      "vacantplotarea",
    ],
    specific: true,
  },
  {
    field: "propertyWidth",
    exact: [
      "सम्पत्तिक्षेत्रचौड़ाई",
      "संपत्तिक्षेत्रचौड़ाई",
      "सम्पत्तिक्षे0चौड़ाई",
      "संपत्तिक्षे0चौड़ाई",
      "चौड़ाई",
      "चैडाई",
      "propertywidth",
    ],
    specific: true,
  },
  {
    field: "propertyLength",
    exact: [
      "सम्पत्तिक्षेत्रलम्बाई",
      "सम्पत्तिक्षेत्रलंबाई",
      "सम्पत्तिक्षे0लम्बाई",
      "सम्पत्तिक्षे0लंबाई",
      "लम्बाई",
      "लंबाई",
      "propertylength",
    ],
    specific: true,
  },
  {
    field: "totalBuiltUpAreaSqFt",
    exact: [
      "मकाननिर्माणक्षेत्रफलवर्गफुट",
      "मकाननिर्माणकाक्षेत्रफल",
      "buildingarea",
      "constructionareasqft",
    ],
    specific: true,
  },
  {
    field: "yearOfConstruction",
    exact: ["निर्माणवर्ष", "constructionyear", "yearofconstruction"],
    specific: false,
  },
  {
    field: "roomCount",
    exact: ["कमरोंकीसंख्या", "कमरोकीसंख्या", "numberofrooms", "roomcount"],
    specific: true,
  },
  {
    field: "floorCount",
    exact: [
      "मंजिलोंकीसंख्या",
      "मंजिलोकीसंख्या",
      "numberoffloors",
      "floorcount",
    ],
    specific: true,
  },
  {
    field: "basementArea",
    exact: ["भूमिगतक्षेत्रफलवर्गफुट", "भूमिगतमंजिल", "basementarea"],
    specific: true,
  },
  {
    field: "groundFloorArea",
    exact: ["तलमंजिल", "groundfloorarea", "groundfloor"],
    specific: true,
  },
  {
    field: "firstFloorArea",
    exact: ["प्रथममंजिल", "पहलीमंजिल", "firstfloorarea", "firstfloor"],
    specific: true,
  },
  {
    field: "secondFloorArea",
    exact: ["दूसरीमंजिल", "secondfloorarea", "secondfloor"],
    specific: true,
  },
  {
    field: "thirdFloorArea",
    exact: ["तीसरीमंजिल", "thirdfloorarea", "thirdfloor"],
    specific: true,
  },
  {
    field: "shopAreaSqFt",
    exact: ["दुकानकाक्षेत्रफलवर्गफुट", "दुकानकाक्षेत्रफल", "shoparea"],
    specific: true,
  },
  { field: "shopNumber", exact: ["दुकानसंख्या", "shopnumber"], specific: true },
  { field: "shopName", exact: ["दुकानकानाम", "shopname"], specific: true },
  {
    field: "tenantName",
    exact: ["किरायदारकानाम", "किरायेदारकानाम", "tenantname"],
    specific: true,
  },
  {
    field: "waterSupply",
    exact: ["जलआपूर्ति", "पानीकनैक्शन", "पानीकनेक्शन", "watersupply"],
    specific: true,
  },
  {
    field: "roadWidthMeters",
    exact: [
      "सड़कचौड़ाईमी0",
      "सड़कचौड़ाईमी",
      "सडककीचैडाई",
      "सड़ककीचौड़ाई",
      "सडककीचौड़ाई",
      "roadwidth",
    ],
    specific: true,
  },
  {
    field: "roadType",
    exact: ["सड़ककाप्रकार", "सडककाप्रकार", "roadtype"],
    specific: false,
  },
  {
    field: "taxpayerInfo",
    exact: ["अन्यकरदाता", "taxpayer", "othertaxpayer"],
    specific: true,
  },
  {
    field: "familyMemberCount",
    exact: [
      "फैमिलीमेम्बर",
      "फैमिलीमेंबर",
      "फेमिलीमंम्बर",
      "familymember",
      "familymembercount",
    ],
    specific: true,
  },
  {
    field: "wardNumber",
    exact: [
      "वार्डन0",
      "वार्डनं",
      "वार्डनं0",
      "वार्डनंबर",
      "वार्डसंख्या",
      "वार्डसं0",
      "wardnumber",
      "wardno",
    ],
    specific: true,
  },
  {
    field: "locality",
    exact: ["मौहल्ला", "मोहल्ला", "mohalla", "locality"],
    specific: false,
  },
]

const FATHER_EXACT = new Set([
  "पितापतिकानाम",
  "fatherhusbandname",
  "fathersname",
  "husbandname",
])

const ALIAS_BY_EXACT = new Map<string, Alias>()
for (const alias of ALIASES) {
  for (const exact of alias.exact) {
    if (!ALIAS_BY_EXACT.has(exact)) ALIAS_BY_EXACT.set(exact, alias)
  }
}

const HINDI_EXACT = new Set(
  ALIASES.flatMap((alias) =>
    alias.exact.filter((token) => /[\u0900-\u097F]/.test(token))
  ).concat(["पितापतिकानाम"])
)

const SPECIFIC_EXACT = new Set(
  ALIASES.filter((alias) => alias.specific).flatMap((alias) => alias.exact)
)
for (const token of ["पितापतिकानाम"]) SPECIFIC_EXACT.add(token)

export function normLoose(value: string): string {
  return value
    .normalize("NFC")
    .replace(/[०-९]/g, (ch) => {
      const index = DEVANAGARI_DIGITS.indexOf(ch)
      return index >= 0 ? String(index) : ch
    })
    .toLowerCase()
    .replace(/[\s.।/_\\\-:：,，()]+/g, "")
}

export function normalizeHouseKey(value: string): string {
  return value.normalize("NFC").replace(/\s+/g, " ").trim()
}

function containsDevanagari(value: string): boolean {
  return /[\u0900-\u097F]/.test(value)
}

export function countDhanauraHeaderSignals(headers: string[]): {
  hindi: number
  specific: number
} {
  const seenHindi = new Set<string>()
  const seenSpecific = new Set<string>()
  let hindi = 0
  let specific = 0
  for (const header of headers) {
    const token = normLoose(header ?? "")
    if (!token) continue
    const hindiHit = HINDI_EXACT.has(token) && containsDevanagari(header ?? "")
    if (hindiHit && !seenHindi.has(token)) {
      seenHindi.add(token)
      hindi++
    }
    if (SPECIFIC_EXACT.has(token) && !seenSpecific.has(token)) {
      seenSpecific.add(token)
      specific++
    }
  }
  return { hindi, specific }
}

export function isDhanauraHeaders(headers: string[]): boolean {
  const english = countEnglishHeaderMatches(headers)
  const { hindi, specific } = countDhanauraHeaderSignals(headers)
  if (hindi >= MIN_HEADER_SCORE && hindi >= english) return true
  return specific >= MIN_HEADER_SCORE && specific > english
}

export function findHeaderRow(rows: string[][]): {
  rowIndex: number
  headers: string[]
  dhanaura: boolean
} | null {
  let best: {
    rowIndex: number
    headers: string[]
    score: number
    dhanaura: boolean
  } | null = null
  const limit = Math.min(rows.length, HEADER_SCAN_LIMIT)
  for (let rowIndex = 0; rowIndex < limit; rowIndex++) {
    const headers = rows[rowIndex] ?? []
    const english = countEnglishHeaderMatches(headers)
    const { hindi, specific } = countDhanauraHeaderSignals(headers)
    const dhanaura = isDhanauraHeaders(headers)
    const score = dhanaura ? Math.max(hindi, specific) : english
    if (score < MIN_HEADER_SCORE) continue
    if (!best || score > best.score) {
      best = { rowIndex, headers, score, dhanaura }
    }
  }
  if (!best) return null
  return {
    rowIndex: best.rowIndex,
    headers: best.headers,
    dhanaura: best.dhanaura,
  }
}

export function emptyDhanauraColumnMap(): DhanauraColumnMap {
  return {
    serialNo: -1,
    oldHouseNo: -1,
    newHouseNo: -1,
    previousOwnerName: -1,
    previousOwnerFatherName: -1,
    ownerName: -1,
    ownerFatherName: -1,
    mobile: -1,
    propertyTitle: -1,
    propertyType: -1,
    buildingType: -1,
    plotAreaSqFt: -1,
    vacantPlotArea: -1,
    propertyWidth: -1,
    propertyLength: -1,
    totalBuiltUpAreaSqFt: -1,
    yearOfConstruction: -1,
    roomCount: -1,
    floorCount: -1,
    basementArea: -1,
    groundFloorArea: -1,
    firstFloorArea: -1,
    secondFloorArea: -1,
    thirdFloorArea: -1,
    shopAreaSqFt: -1,
    shopNumber: -1,
    shopName: -1,
    tenantName: -1,
    waterSupply: -1,
    roadWidthMeters: -1,
    roadType: -1,
    taxpayerInfo: -1,
    familyMemberCount: -1,
    wardNumber: -1,
    locality: -1,
  }
}

function precedingOwnerField(
  headers: string[],
  fatherIndex: number,
  map: DhanauraColumnMap
): "ownerName" | "previousOwnerName" | null {
  for (let index = fatherIndex - 1; index >= 0; index--) {
    const token = normLoose(headers[index] ?? "")
    if (!token || FATHER_EXACT.has(token)) continue
    if (map.ownerName === index) return "ownerName"
    if (map.previousOwnerName === index) return "previousOwnerName"
    const alias = ALIAS_BY_EXACT.get(token)
    if (alias?.field === "ownerName" || alias?.field === "previousOwnerName") {
      return alias.field
    }
  }
  return null
}

export function buildDhanauraColumnMap(headers: string[]): DhanauraColumnMap {
  const map = emptyDhanauraColumnMap()
  const fatherIndexes: number[] = []
  const ambiguousOwnerIndexes: number[] = []
  headers.forEach((header, index) => {
    const token = normLoose(header ?? "")
    if (!token) return
    if (FATHER_EXACT.has(token)) {
      fatherIndexes.push(index)
      return
    }
    if (AMBIGUOUS_OWNER_EXACT.has(token)) {
      ambiguousOwnerIndexes.push(index)
      return
    }
    const alias = ALIAS_BY_EXACT.get(token)
    if (!alias || map[alias.field] >= 0) return
    map[alias.field] = index
  })

  for (const index of ambiguousOwnerIndexes) {
    // When a "नया/नये मकान मालिक" column exists, the unlabeled owner is previous.
    if (map.ownerName >= 0 && map.previousOwnerName < 0) {
      map.previousOwnerName = index
      continue
    }
    if (map.ownerName < 0) {
      map.ownerName = index
    }
  }

  for (const index of fatherIndexes) {
    const ownerField = precedingOwnerField(headers, index, map)
    if (ownerField === "ownerName" && map.ownerFatherName < 0) {
      map.ownerFatherName = index
      continue
    }
    if (ownerField === "previousOwnerName" && map.previousOwnerFatherName < 0) {
      map.previousOwnerFatherName = index
    }
  }
  return map
}

export function unmappedDhanauraHeaders(
  headers: string[],
  map: DhanauraColumnMap
): string[] {
  const used = new Set(Object.values(map).filter((index) => index >= 0))
  const unmapped: string[] = []
  headers.forEach((header, index) => {
    const label = header.trim()
    if (!label || used.has(index)) return
    unmapped.push(label)
  })
  return unmapped
}

export function mappedExtraFields(
  map: DhanauraColumnMap
): DhanauraExtraField[] {
  return DHANAURA_EXTRA_FIELDS.filter((field) => map[field] >= 0)
}

export function missingDhanauraRequired(
  map: DhanauraColumnMap,
  sheetWardNumber?: number | null
): string[] {
  const missing: string[] = []
  if (map.wardNumber < 0 && !(sheetWardNumber != null && sheetWardNumber > 0)) {
    missing.push("वार्ड न०")
  }
  if (map.newHouseNo < 0) missing.push("नया म०न०")
  return missing
}

/** One positive ward number written in the title rows. Null when absent or mixed. */
export function unambiguousSheetWardNumber(titleRows: string[][]): number | null {
  const found = new Set<number>()
  for (const row of titleRows) {
    for (const cell of row) {
      const text = cell.trim()
      if (!text || !/वार्ड|ward/i.test(text)) continue
      const wardNumber = extractWardNumber(text, "")
      if (wardNumber != null && wardNumber > 0) found.add(wardNumber)
    }
  }
  if (found.size !== 1) return null
  return [...found][0] ?? null
}

function formattedLeadingZeros(text: string, value: number): string | null {
  if (!Number.isInteger(value) || value < 0 || !/^0+\d+$/.test(text))
    return null
  return Number(text) === value ? text : null
}

/** ExcelJS drops zero-padding from cell.text. A format of only zeros is that padding. */
function zeroPadFromNumFmt(
  value: number,
  numFmt: string | undefined
): string | null {
  if (!Number.isInteger(value) || value < 0 || !numFmt) return null
  const fmt = numFmt.trim()
  if (!/^0+$/.test(fmt)) return null
  const text = String(value).padStart(fmt.length, "0")
  return text.startsWith("0") ? text : null
}

/** Letter glued to an abbreviation zero, or a Kruti glyph outside plain ASCII. */
function hasKrutiMarker(text: string): boolean {
  if (!text || /[\u0900-\u097F]/.test(text)) return false
  if (/okmz/i.test(text)) return true
  if (/[A-Za-z]0|0[A-Za-z]/.test(text)) return true
  return /[À-ÿƒ„…†‡ˆ‰Š‹ºí«îØÝæçÁôÄ³÷¥êëìïÈ¸ÜÞß¼½¿À¾Œ]/.test(text)
}

/** English column labels must not be passed through the Kruti converter. */
function isPlainEnglishLabel(text: string): boolean {
  return /^[A-Za-z][A-Za-z .'/()-]*$/.test(text.trim())
}

function decodeLegacyCellText(
  text: string,
  fontName: string | undefined,
  decodeKrutiRow = false
): string {
  if (!text) return text
  if (/[\u0900-\u097F]/.test(text)) return text
  if (!looksLikeKrutiDev(text)) return text
  if (isLegacyHindiFont(fontName)) return krutiDevToUnicode(text)
  if (isPlainEnglishLabel(text)) return text
  if (!decodeKrutiRow && !hasKrutiMarker(text)) return text
  return krutiDevToUnicode(text)
}

type CellReadOptions = { blankMergedSlaves?: boolean; decodeKrutiRow?: boolean }

function cellSourceText(
  cell: ExcelJS.Cell,
  options?: { blankMergedSlaves?: boolean }
): string {
  if (options?.blankMergedSlaves && cell.isMerged && cell.master !== cell) {
    return ""
  }
  const value = cell.value
  if (value == null || typeof value === "number") return ""
  if (typeof value === "string") return value.trim()
  if (
    typeof value === "object" &&
    Array.isArray((value as { richText?: Array<{ text?: string }> }).richText)
  ) {
    return (value as { richText: Array<{ text?: string }> }).richText
      .map((part) => part.text ?? "")
      .join("")
      .trim()
  }
  const text = cell.text?.trim() ?? ""
  if (text) return text
  return excelValueToString(value)
}

function rowHasKrutiSignal(
  row: ExcelJS.Row,
  columnCount: number,
  options?: { blankMergedSlaves?: boolean }
): boolean {
  for (let col = 1; col <= columnCount; col++) {
    const cell = row.getCell(col)
    if (options?.blankMergedSlaves && cell.isMerged && cell.master !== cell) {
      continue
    }
    if (isLegacyHindiFont(cell.font?.name)) return true
    if (hasKrutiMarker(cellSourceText(cell, options))) return true
  }
  return false
}

export function readCellDisplay(
  cell: ExcelJS.Cell,
  options?: CellReadOptions
): string {
  if (options?.blankMergedSlaves && cell.isMerged && cell.master !== cell) {
    return ""
  }
  const value = cell.value
  if (value == null) return ""
  const fontName = cell.font?.name
  const decodeKrutiRow = options?.decodeKrutiRow === true
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return ""
    const formatted =
      formattedLeadingZeros(cell.text?.trim() ?? "", value) ??
      zeroPadFromNumFmt(value, cell.numFmt)
    if (formatted) return formatted
    return String(value)
  }
  if (typeof value === "string") {
    return decodeLegacyCellText(value.trim(), fontName, decodeKrutiRow)
  }
  if (
    typeof value === "object" &&
    value &&
    Array.isArray((value as { richText?: Array<{ text?: string }> }).richText)
  ) {
    const rich = (value as { richText: Array<{ text?: string }> }).richText
      .map((part) => part.text ?? "")
      .join("")
      .trim()
    return decodeLegacyCellText(rich, fontName, decodeKrutiRow)
  }
  const text = cell.text?.trim() ?? ""
  if (text) return decodeLegacyCellText(text, fontName, decodeKrutiRow)
  return decodeLegacyCellText(excelValueToString(value), fontName, decodeKrutiRow)
}

export function readRowStrings(
  row: ExcelJS.Row,
  columnCount: number,
  options?: { blankMergedSlaves?: boolean }
): string[] {
  const decodeKrutiRow = rowHasKrutiSignal(row, columnCount, options)
  const values: string[] = []
  for (let col = 1; col <= columnCount; col++) {
    values.push(readCellDisplay(row.getCell(col), { ...options, decodeKrutiRow }))
  }
  return values
}

export type WorkbookLayout = {
  sheet: ExcelJS.Worksheet
  headerRowNumber: number
  headers: string[]
  columnCount: number
  preset: MappingPreset
  map: ColumnMap
  dhanauraMap: DhanauraColumnMap | null
  unmappedColumns: string[]
  storedExtraFields: DhanauraExtraField[]
  missingRequired: string[]
  /** Set only when the ward column is absent and the title names one ward. */
  sheetWardNumber: number | null
}

function workbookSheetCandidates(
  workbook: ExcelJS.Workbook
): ExcelJS.Worksheet[] {
  const named = workbook.getWorksheet("Survey Data")
  const candidates: ExcelJS.Worksheet[] = []
  if (named) candidates.push(named)
  for (const sheet of workbook.worksheets) {
    if (sheet !== named) candidates.push(sheet)
  }
  return candidates
}

export type WorkbookHeaderFailure = {
  code: "IMPORT_HEADER_INVALID"
  message: string
  selectedSheet: string | null
  headerRowNumber: number | null
  normalizedHeaders: string[]
  missingRequired: string[]
  unrecognizedHeaders: string[]
  suggestedCorrection: string
}

function resolveDhanauraRequirements(
  preview: string[][],
  found: { rowIndex: number; headers: string[]; dhanaura: boolean }
): {
  dhanauraMap: DhanauraColumnMap | null
  sheetWardNumber: number | null
  missingRequired: string[]
} {
  if (!found.dhanaura) {
    return { dhanauraMap: null, sheetWardNumber: null, missingRequired: [] }
  }
  const dhanauraMap = buildDhanauraColumnMap(found.headers)
  const sheetWardNumber =
    dhanauraMap.wardNumber < 0
      ? unambiguousSheetWardNumber(preview.slice(0, found.rowIndex))
      : null
  return {
    dhanauraMap,
    sheetWardNumber,
    missingRequired: missingDhanauraRequired(dhanauraMap, sheetWardNumber),
  }
}

export function describeWorkbookHeaderFailure(
  workbook: ExcelJS.Workbook
): WorkbookHeaderFailure {
  const suggestedCorrection =
    "Add a header row that includes वार्ड न० and नया म०न० (or English Ward Number / New House Number)."
  const candidates = workbookSheetCandidates(workbook)
  let best: {
    sheet: ExcelJS.Worksheet
    rowIndex: number
    headers: string[]
    score: number
    dhanaura: boolean
  } | null = null

  for (const sheet of candidates) {
    const columnCount = Math.max(sheet.columnCount, 1)
    const last = Math.min(sheet.rowCount || 0, HEADER_SCAN_LIMIT)
    const preview: string[][] = []
    for (let rowNumber = 1; rowNumber <= last; rowNumber++) {
      preview.push(
        readRowStrings(sheet.getRow(rowNumber), columnCount, {
          blankMergedSlaves: true,
        })
      )
    }
    const found = findHeaderRow(preview)
    if (found) {
      const resolved = resolveDhanauraRequirements(preview, found)
      const dhanauraMap = resolved.dhanauraMap
      const missing = resolved.missingRequired
      const unmapped = dhanauraMap
        ? unmappedDhanauraHeaders(found.headers, dhanauraMap)
        : found.headers.filter((h) => h.trim())
      return {
        code: "IMPORT_HEADER_INVALID",
        message:
          missing.length > 0
            ? `Missing required columns: ${missing.join(", ")}`
            : "Workbook has no usable header row or survey columns",
        selectedSheet: sheet.name,
        headerRowNumber: found.rowIndex + 1,
        normalizedHeaders: found.headers.map((h) => normLoose(h)),
        missingRequired: missing,
        unrecognizedHeaders: unmapped,
        suggestedCorrection,
      }
    }
    for (let rowIndex = 0; rowIndex < preview.length; rowIndex++) {
      const headers = preview[rowIndex] ?? []
      const english = countEnglishHeaderMatches(headers)
      const { hindi, specific } = countDhanauraHeaderSignals(headers)
      const dhanaura = isDhanauraHeaders(headers)
      const score = dhanaura ? Math.max(hindi, specific) : english
      if (!best || score > best.score) {
        best = { sheet, rowIndex, headers, score, dhanaura }
      }
    }
  }

  return {
    code: "IMPORT_HEADER_INVALID",
    message: "Workbook has no usable header row or survey columns",
    selectedSheet: best?.sheet.name ?? candidates[0]?.name ?? null,
    headerRowNumber: best && best.score > 0 ? best.rowIndex + 1 : null,
    normalizedHeaders: (best?.headers ?? []).map((h) => normLoose(h)),
    missingRequired: ["वार्ड न०", "नया म०न०"],
    unrecognizedHeaders: (best?.headers ?? []).filter((h) => h.trim()),
    suggestedCorrection,
  }
}

export function resolveWorkbookLayout(
  workbook: ExcelJS.Workbook
): WorkbookLayout | null {
  for (const sheet of workbookSheetCandidates(workbook)) {
    const columnCount = Math.max(sheet.columnCount, 1)
    const last = Math.min(sheet.rowCount || 0, HEADER_SCAN_LIMIT)
    const preview: string[][] = []
    for (let rowNumber = 1; rowNumber <= last; rowNumber++) {
      preview.push(
        readRowStrings(sheet.getRow(rowNumber), columnCount, {
          blankMergedSlaves: true,
        })
      )
    }
    const found = findHeaderRow(preview)
    if (!found) continue
    const dhanaura = resolveDhanauraRequirements(preview, found)
    const dhanauraMap = dhanaura.dhanauraMap
    const resolved = resolveColumnMap(found.headers, found.headers.length)
    return {
      sheet,
      headerRowNumber: found.rowIndex + 1,
      headers: found.headers,
      columnCount,
      preset: found.dhanaura ? "dhanaura-gis" : resolved.preset,
      map: resolved.map,
      dhanauraMap,
      unmappedColumns: dhanauraMap
        ? unmappedDhanauraHeaders(found.headers, dhanauraMap)
        : [],
      storedExtraFields: dhanauraMap ? mappedExtraFields(dhanauraMap) : [],
      missingRequired: dhanaura.missingRequired,
      sheetWardNumber: dhanaura.sheetWardNumber,
    }
  }
  return null
}

const DEFAULT_UNIT_NO = "001"

const GIS_USE_BY_PROPERTY_TYPE: Record<string, string> = {
  residential: "R",
  आवासीय: "R",
  रिहायशी: "R",
  commercial: "C",
  व्यावसायिक: "C",
  वाणिज्यिक: "C",
  mix: "M",
  mixed: "M",
  मिश्रित: "M",
  "open land": "P",
  खुला: "P",
  "खाली प्लाट": "P",
}

function asciiDigits(value: string): string {
  return value.replace(/[०-९]/g, (digit) =>
    String(DEVANAGARI_DIGITS.indexOf(digit))
  )
}

/** Positive integer digits from a house number. Null when the text is not numeric. */
export function parcelDigitsFromHouse(houseKey: string): string | null {
  const ascii = asciiDigits(normalizeHouseKey(houseKey))
  if (!/^[1-9]\d*$/.test(ascii) && !/^0+[1-9]\d*$/.test(ascii)) return null
  return ascii.replace(/^0+/, "")
}

export function gisUseFromPropertyType(propertyType: string): {
  letter: string
  recognized: boolean
} {
  const token = propertyType
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
  const letter = GIS_USE_BY_PROPERTY_TYPE[token]
  if (!letter) return { letter: "R", recognized: false }
  return { letter, recognized: true }
}

/**
 * GIS Survey Id from the new house number.
 * Parcel is that number padded to at least 6 digits. Unit is 001.
 * The original house text stays on presentHouseNo.
 */
export function surveyIdForHouse(input: {
  ulbCode: string
  wardNumber: number
  houseKey: string
  propertyType?: string
}): {
  surveyId: string
  parcelNo: string
  propertyNo: string
  gisUseCode: string
  gisUseRecognized: boolean
} {
  const digits = parcelDigitsFromHouse(input.houseKey)
  if (!digits) {
    throw new Error("House number must be numeric to build the parcel segment")
  }
  const gis = gisUseFromPropertyType(input.propertyType ?? "")
  const parcelNo = normalizeParcelNo(digits)
  const propertyNo = normalizePropertyNo(DEFAULT_UNIT_NO)
  return {
    parcelNo,
    propertyNo,
    gisUseCode: gis.letter,
    gisUseRecognized: gis.recognized,
    surveyId: generateSurveyId({
      ulbCode: input.ulbCode,
      wardNo: input.wardNumber,
      parcelNo,
      propertyNo,
      gisUseCode: gis.letter,
    }),
  }
}

export type ImportedTaxRateZoneDecision =
  | { kind: "set"; taxRateZone: string }
  | { kind: "keep"; warning: string | null }
  | { kind: "error"; field: "roadWidthMeters"; message: string }

/**
 * New rows and rows with no saved zone take the width band.
 * A saved tax road zone is left unchanged. An unresolved width is an error
 * only when there is no saved zone to keep.
 */
export function decideImportedTaxRateZone(input: {
  roadWidth: string
  existingTaxRateZone?: string | null
}): ImportedTaxRateZoneDecision {
  const label = taxRateZoneLabelFromRoadWidth(input.roadWidth)
  const existing = input.existingTaxRateZone?.trim() ?? ""
  if (existing) {
    return {
      kind: "keep",
      warning: label
        ? null
        : "Road width could not be resolved to a tax road zone; existing tax road zone was kept",
    }
  }
  if (!label) {
    return {
      kind: "error",
      field: "roadWidthMeters",
      message: input.roadWidth.trim()
        ? `Road width "${input.roadWidth.trim()}" does not match a tax road zone`
        : "Road width is required to assign the tax road zone",
    }
  }
  return { kind: "set", taxRateZone: label }
}

export function readImportLayout(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const layout = (value as { importLayout?: unknown }).importLayout
  return typeof layout === "string" ? layout : null
}

/** Read string keys from Survey.sourceExtras JSON without inventing values. */
export function readSourceExtraString(
  extras: unknown,
  key: string
): string | null {
  if (!extras || typeof extras !== "object" || Array.isArray(extras))
    return null
  const value = (extras as Record<string, unknown>)[key]
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Merge newly parsed Dhanaura extras onto existing JSON.
 * Blank Excel cells omit keys in `incoming` — those existing values are preserved.
 */
export function mergeDhanauraSourceExtras(
  existing: unknown,
  incoming: Record<string, string>
): Record<string, unknown> {
  const base: Record<string, unknown> =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {}
  for (const [key, value] of Object.entries(incoming)) {
    if (value.trim()) base[key] = value
  }
  base.importLayout = DHANAURA_IMPORT_LAYOUT
  return base
}

/**
 * On GIS re-import UPDATE, blank owner cells must not clear existing DB values.
 * Returns only the owner fields that should be written.
 */
export function dhanauraOwnerFieldsForUpdate(parsed: {
  ownerName: string
  ownerFatherName: string
}): { ownerName?: string; ownerFatherName?: string } {
  const fields: { ownerName?: string; ownerFatherName?: string } = {}
  if (parsed.ownerName.trim()) fields.ownerName = parsed.ownerName.trim()
  if (parsed.ownerFatherName.trim())
    fields.ownerFatherName = parsed.ownerFatherName.trim()
  return fields
}

export type HouseMatch = {
  id: string
  presentHouseNo: string | null
  houseNo: string | null
  surveyId?: string | null
  parcelNo?: string | null
  importLayout?: string | null
}

export function houseTextMatches(
  row: HouseMatch,
  houseKey: string,
  usesNewHouse: boolean
): boolean {
  if (usesNewHouse) {
    return normalizeHouseKey(row.presentHouseNo ?? "") === houseKey
  }
  return (
    normalizeHouseKey(row.houseNo ?? "") === houseKey &&
    normalizeHouseKey(row.presentHouseNo ?? "") === ""
  )
}

export function decideDhanauraMatch(input: {
  matches: HouseMatch[]
  surveyIdHit: HouseMatch | null
  houseKey: string
  usesNewHouse: boolean
  parcelNo?: string
}):
  | { kind: "create" }
  | { kind: "existing"; id: string; replaceSurveyId: boolean }
  | { kind: "error"; message: string } {
  const unique = new Map<string, HouseMatch>()
  for (const row of input.matches) unique.set(row.id, row)

  const target = [...unique.values()][0]
  const writingNewId =
    unique.size === 0 || target?.importLayout === DHANAURA_IMPORT_LAYOUT

  if (input.surveyIdHit && !unique.has(input.surveyIdHit.id)) {
    if (
      houseTextMatches(input.surveyIdHit, input.houseKey, input.usesNewHouse)
    ) {
      unique.set(input.surveyIdHit.id, input.surveyIdHit)
    } else if (writingNewId) {
      return {
        kind: "error",
        message: "Survey Id already belongs to a different house number",
      }
    }
  }

  if (unique.size > 1) {
    return {
      kind: "error",
      message: "Multiple surveys match this house number in the ward",
    }
  }
  const only = [...unique.values()][0]
  if (!only) return { kind: "create" }

  const replaceSurveyId = only.importLayout === DHANAURA_IMPORT_LAYOUT
  if (!replaceSurveyId && input.parcelNo && only.surveyId) {
    const parsed = parseGisSurveyId(only.surveyId)
    if (parsed && parsed.parcelNo !== input.parcelNo) {
      return {
        kind: "error",
        message: "Existing survey id parcel does not match this house number",
      }
    }
  }
  return { kind: "existing", id: only.id, replaceSurveyId }
}

const EMPTY_CELL = /^(n\/a|na|null|-|none)$/i

function fieldText(values: string[], index: number): string {
  if (index < 0) return ""
  const text = (values[index] ?? "").trim()
  if (!text || EMPTY_CELL.test(text)) return ""
  return text
}

export type DhanauraFloor = {
  floorLabel: string
  areaSqFt: number
  buildingType: string | null
  sortOrder: number
  rawSegment: string
}

export type ParsedDhanauraRow = {
  empty: boolean
  errors: Array<{ field: string; message: string }>
  houseKey: string
  usesNewHouse: boolean
  oldHouseNo: string
  newHouseNo: string
  wardNumber: number | null
  locality: string
  ownerName: string
  ownerFatherName: string
  mobile: string
  propertyType: string
  buildingType: string
  yearOfConstruction: string
  roadType: string
  roadWidthMeters: string
  taxRateZone: string | null
  plotAreaSqFt?: number
  totalBuiltUpAreaSqFt?: number
  hasMunicipalWaterSupply?: boolean
  waterSourceType: string | null
  floors: DhanauraFloor[]
  sourceExtras: Record<string, string>
}

function readMeasurement(
  raw: string,
  field: string,
  errors: Array<{ field: string; message: string }>
): number | undefined {
  if (!raw) return undefined
  const value = parseNumber(raw)
  if (value === undefined) {
    errors.push({ field, message: `${field} must be a number` })
    return undefined
  }
  if (value < 0) {
    errors.push({ field, message: `${field} cannot be negative` })
    return undefined
  }
  return value
}

function pushFloor(
  floors: DhanauraFloor[],
  label: string,
  area: number | undefined,
  buildingType: string
) {
  if (area === undefined) return
  floors.push({
    floorLabel: label,
    areaSqFt: area,
    buildingType: buildingType || null,
    sortOrder: floors.length,
    rawSegment: `${label} - ${area} SqFt`,
  })
}

export function parseDhanauraRow(
  values: string[],
  map: DhanauraColumnMap,
  sheetWardNumber?: number | null
): ParsedDhanauraRow {
  const errors: Array<{ field: string; message: string }> = []
  const oldHouseNo = normalizeHouseKey(fieldText(values, map.oldHouseNo))
  const newHouseNo = normalizeHouseKey(fieldText(values, map.newHouseNo))
  const houseKey = newHouseNo

  const extras: Record<string, string> = {
    importLayout: DHANAURA_IMPORT_LAYOUT,
  }
  if (houseKey) extras.identityHouseKey = houseKey
  for (const field of DHANAURA_EXTRA_FIELDS) {
    const text = fieldText(values, map[field])
    if (text) extras[field] = text
  }

  const mappedValues = DHANAURA_FIELD_ORDER.map((field) =>
    fieldText(values, map[field])
  )
  const empty = mappedValues.every((value) => value.length === 0)

  const wardRaw = fieldText(values, map.wardNumber)
  const cellWardNumber = wardRaw ? extractWardNumber(wardRaw, "") : null
  const wardNumber =
    map.wardNumber >= 0
      ? cellWardNumber
      : sheetWardNumber != null && sheetWardNumber > 0
        ? sheetWardNumber
        : null
  const plotAreaSqFt = readMeasurement(
    fieldText(values, map.plotAreaSqFt),
    "plotAreaSqFt",
    errors
  )
  const totalBuiltUpAreaSqFt = readMeasurement(
    fieldText(values, map.totalBuiltUpAreaSqFt),
    "totalBuiltUpAreaSqFt",
    errors
  )
  const buildingType = fieldText(values, map.buildingType)
  const floors: DhanauraFloor[] = []
  pushFloor(
    floors,
    DHANAURA_FLOOR_LABELS.basement,
    readMeasurement(
      fieldText(values, map.basementArea),
      "basementArea",
      errors
    ),
    buildingType
  )
  pushFloor(
    floors,
    DHANAURA_FLOOR_LABELS.ground,
    readMeasurement(
      fieldText(values, map.groundFloorArea),
      "groundFloorArea",
      errors
    ),
    buildingType
  )
  pushFloor(
    floors,
    DHANAURA_FLOOR_LABELS.first,
    readMeasurement(
      fieldText(values, map.firstFloorArea),
      "firstFloorArea",
      errors
    ),
    buildingType
  )
  pushFloor(
    floors,
    DHANAURA_FLOOR_LABELS.second,
    readMeasurement(
      fieldText(values, map.secondFloorArea),
      "secondFloorArea",
      errors
    ),
    buildingType
  )
  pushFloor(
    floors,
    DHANAURA_FLOOR_LABELS.third,
    readMeasurement(
      fieldText(values, map.thirdFloorArea),
      "thirdFloorArea",
      errors
    ),
    buildingType
  )

  const waterRaw = fieldText(values, map.waterSupply)
  const water = parseWater(waterRaw)
  const mobileRaw = fieldText(values, map.mobile)
  const mobile = !mobileRaw || mobileRaw === "0" ? "" : mobileRaw
  const roadWidthMeters = fieldText(values, map.roadWidthMeters)
  const taxRateZone = taxRateZoneLabelFromRoadWidth(roadWidthMeters)

  if (!empty && !newHouseNo) {
    errors.push({
      field: "newHouseNo",
      message: "New house number (नया म०न०) is required",
    })
  } else if (!empty && !parcelDigitsFromHouse(newHouseNo)) {
    errors.push({
      field: "newHouseNo",
      message: "New house number must be numeric to build the parcel segment",
    })
  }
  if (!empty && map.wardNumber >= 0 && !wardNumber) {
    errors.push({
      field: "wardNumber",
      message: wardRaw
        ? `Ward number is invalid: ${wardRaw}`
        : "Ward number is required",
    })
  }

  return {
    empty,
    errors,
    houseKey,
    usesNewHouse: newHouseNo.length > 0,
    oldHouseNo,
    newHouseNo,
    wardNumber,
    locality: fieldText(values, map.locality),
    ownerName: fieldText(values, map.ownerName),
    ownerFatherName: fieldText(values, map.ownerFatherName),
    mobile,
    propertyType: fieldText(values, map.propertyType),
    buildingType,
    yearOfConstruction: fieldText(values, map.yearOfConstruction),
    roadType: fieldText(values, map.roadType),
    roadWidthMeters,
    taxRateZone,
    plotAreaSqFt,
    totalBuiltUpAreaSqFt,
    hasMunicipalWaterSupply: water.hasMunicipalWaterSupply,
    waterSourceType: water.waterSourceType,
    floors,
    sourceExtras: extras,
  }
}

function parseWater(value: string): {
  hasMunicipalWaterSupply?: boolean
  waterSourceType: string | null
} {
  if (!value) return { waterSourceType: null }
  if (["हाँ", "हां", "हा"].includes(value)) {
    return { hasMunicipalWaterSupply: true, waterSourceType: value }
  }
  if (["नहीं", "नही"].includes(value)) {
    return { hasMunicipalWaterSupply: false, waterSourceType: value }
  }
  const bool = parseBool(value)
  if (bool !== undefined) {
    return { hasMunicipalWaterSupply: bool, waterSourceType: value }
  }
  return { waterSourceType: value }
}

export function countNonEmptyDataRows(
  sheet: ExcelJS.Worksheet,
  layout: Pick<
    WorkbookLayout,
    "headerRowNumber" | "columnCount" | "dhanauraMap"
  >
): number {
  let count = 0
  for (
    let rowNumber = layout.headerRowNumber + 1;
    rowNumber <= sheet.rowCount;
    rowNumber++
  ) {
    const values = readRowStrings(sheet.getRow(rowNumber), layout.columnCount)
    if (layout.dhanauraMap) {
      if (!parseDhanauraRow(values, layout.dhanauraMap).empty) count++
      continue
    }
    if (values.some((value) => value.trim().length > 0)) count++
  }
  return count
}

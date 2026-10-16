/**
 * Kruti Dev 010 / DevLys-style ANSI text → Unicode Devanagari.
 * Port of the public domain Convert_to_Unicode / Replace_Symbols algorithm
 * used by Hindi font converters (array_one / array_two glyph tables).
 */

const ARRAY_ONE = [
  "ñ",
  "Q+Z",
  "sas",
  "aa",
  ")Z",
  "ZZ",
  "‘",
  "’",
  "“",
  "”",
  "å",
  "ƒ",
  "„",
  "…",
  "†",
  "‡",
  "ˆ",
  "‰",
  "Š",
  "‹",
  "¶+",
  "d+",
  "[+k",
  "[+",
  "x+",
  "T+",
  "t+",
  "M+",
  "<+",
  "Q+",
  ";+",
  "j+",
  "u+",
  "Ùk",
  "Ù",
  "ä",
  "–",
  "—",
  "é",
  "™",
  "=kk",
  "f=k",
  "à",
  "á",
  "â",
  "ã",
  "ºz",
  "º",
  "í",
  "{k",
  "{",
  "=",
  "«",
  "Nî",
  "Vî",
  "Bî",
  "Mî",
  "<î",
  "|",
  "K",
  "}",
  "J",
  "Vª",
  "Mª",
  "<ªª",
  "Nª",
  "Ø",
  "Ý",
  "nzZ",
  "æ",
  "ç",
  "Á",
  "xz",
  "#",
  ":",
  "v‚",
  "vks",
  "vkS",
  "vk",
  "v",
  "b±",
  "Ã",
  "bZ",
  "b",
  "m",
  "Å",
  ",s",
  ",",
  "_",
  "ô",
  "d",
  "Dk",
  "D",
  "[k",
  "[",
  "x",
  "Xk",
  "X",
  "Ä",
  "?k",
  "?",
  "³",
  "pkS",
  "p",
  "Pk",
  "P",
  "N",
  "t",
  "Tk",
  "T",
  ">",
  "÷",
  "¥",
  "ê",
  "ë",
  "V",
  "B",
  "ì",
  "ï",
  "M+",
  "<+",
  "M",
  "<",
  ".k",
  ".",
  "r",
  "Rk",
  "R",
  "Fk",
  "F",
  ")",
  "n",
  "/k",
  "èk",
  "/",
  "Ë",
  "è",
  "u",
  "Uk",
  "U",
  "i",
  "Ik",
  "I",
  "Q",
  "¶",
  "c",
  "Ck",
  "C",
  "Hk",
  "H",
  "e",
  "Ek",
  "E",
  ";",
  "¸",
  "j",
  "y",
  "Yk",
  "Y",
  "G",
  "o",
  "Ok",
  "O",
  "'k",
  "'",
  '"k',
  '"',
  "l",
  "Lk",
  "L",
  "g",
  "È",
  "z",
  "Ì",
  "Í",
  "Î",
  "Ï",
  "Ñ",
  "Ò",
  "Ó",
  "Ô",
  "Ö",
  "Ø",
  "Ù",
  "Ük",
  "Ü",
  "‚",
  "ks",
  "kS",
  "k",
  "h",
  "q",
  "w",
  "`",
  "s",
  "S",
  "a",
  "¡",
  "%",
  "W",
  "•",
  "·",
  "∙",
  "·",
  "~j",
  "~",
  "\\",
  "+",
  " ः",
  "^",
  "*",
  "Þ",
  "ß",
  "(",
  "¼",
  "½",
  "¿",
  "À",
  "¾",
  "A",
  "-",
  "&",
  "&",
  "Œ",
  "]",
  "~ ",
  "@",
] as const

const ARRAY_TWO = [
  "॰",
  "QZ+",
  "sa",
  "a",
  "र्द्ध",
  "Z",
  '"',
  '"',
  "'",
  "'",
  "०",
  "१",
  "२",
  "३",
  "४",
  "५",
  "६",
  "७",
  "८",
  "९",
  "फ़्",
  "क़",
  "ख़",
  "ख़्",
  "ग़",
  "ज़्",
  "ज़",
  "ड़",
  "ढ़",
  "फ़",
  "य़",
  "ऱ",
  "ऩ",
  "त्त",
  "त्त्",
  "क्त",
  "दृ",
  "कृ",
  "न्न",
  "न्न्",
  "=k",
  "f=",
  "ह्न",
  "ह्य",
  "हृ",
  "ह्म",
  "ह्र",
  "ह्",
  "द्द",
  "क्ष",
  "क्ष्",
  "त्र",
  "त्र्",
  "छ्य",
  "ट्य",
  "ठ्य",
  "ड्य",
  "ढ्य",
  "द्य",
  "ज्ञ",
  "द्व",
  "श्र",
  "ट्र",
  "ड्र",
  "ढ्र",
  "छ्र",
  "क्र",
  "फ्र",
  "र्द्र",
  "द्र",
  "प्र",
  "प्र",
  "ग्र",
  "रु",
  "रू",
  "ऑ",
  "ओ",
  "औ",
  "आ",
  "अ",
  "ईं",
  "ई",
  "ई",
  "इ",
  "उ",
  "ऊ",
  "ऐ",
  "ए",
  "ऋ",
  "क्क",
  "क",
  "क",
  "क्",
  "ख",
  "ख्",
  "ग",
  "ग",
  "ग्",
  "घ",
  "घ",
  "घ्",
  "ङ",
  "चै",
  "च",
  "च",
  "च्",
  "छ",
  "ज",
  "ज",
  "ज्",
  "झ",
  "झ्",
  "ञ",
  "ट्ट",
  "ट्ठ",
  "ट",
  "ठ",
  "ड्ड",
  "ड्ढ",
  "ड़",
  "ढ़",
  "ड",
  "ढ",
  "ण",
  "ण्",
  "त",
  "त",
  "त्",
  "थ",
  "थ्",
  "द्ध",
  "द",
  "ध",
  "ध",
  "ध्",
  "ध्",
  "ध्",
  "न",
  "न",
  "न्",
  "प",
  "प",
  "प्",
  "फ",
  "फ्",
  "ब",
  "ब",
  "ब्",
  "भ",
  "भ्",
  "म",
  "म",
  "म्",
  "य",
  "य्",
  "र",
  "ल",
  "ल",
  "ल्",
  "ळ",
  "व",
  "व",
  "व्",
  "श",
  "श्",
  "ष",
  "ष्",
  "स",
  "स",
  "स्",
  "ह",
  "ीं",
  "्र",
  "द्द",
  "ट्ट",
  "ट्ठ",
  "ड्ड",
  "कृ",
  "भ",
  "्य",
  "ड्ढ",
  "झ्",
  "क्र",
  "त्त्",
  "श",
  "श्",
  "ॉ",
  "ो",
  "ौ",
  "ा",
  "ी",
  "ु",
  "ू",
  "ृ",
  "े",
  "ै",
  "ं",
  "ँ",
  "ः",
  "ॅ",
  "ऽ",
  "ऽ",
  "ऽ",
  "ऽ",
  "्र",
  "्",
  "?",
  "़",
  ":",
  "‘",
  "’",
  "“",
  "”",
  ";",
  "(",
  ")",
  "{",
  "}",
  "=",
  "।",
  ".",
  "-",
  "µ",
  "॰",
  ",",
  "् ",
  "/",
] as const

const MATRAS =
  "अ आ इ ई उ ऊ ए ऐ ओ औ ा ि ी ु ू ृ े ै ो ौ ं : ँ ॅ"

function replaceAllLiteral(haystack: string, from: string, to: string): string {
  if (!from) return haystack
  let result = haystack
  let index = result.indexOf(from)
  while (index !== -1) {
    result = result.slice(0, index) + to + result.slice(index + from.length)
    index = result.indexOf(from, index + to.length)
  }
  return result
}

function replaceSymbols(input: string): string {
  let modified = input
  if (!modified) return modified

  for (let i = 0; i < ARRAY_ONE.length; i++) {
    const from = ARRAY_ONE[i]
    const to = ARRAY_TWO[i]
    if (from == null || to == null) continue
    modified = replaceAllLiteral(modified, from, to)
  }

  modified = modified.replace(/±/g, "Zं")
  modified = modified.replace(/Æ/g, "र्f")

  let positionOfI = modified.indexOf("f")
  while (positionOfI !== -1) {
    const next = modified.charAt(positionOfI + 1)
    const pair = "f" + next
    modified =
      modified.slice(0, positionOfI) +
      next +
      "ि" +
      modified.slice(positionOfI + pair.length)
    positionOfI = modified.indexOf("f", positionOfI + 1)
  }

  modified = modified.replace(/Ç/g, "fa")
  modified = modified.replace(/É/g, "र्fa")

  let positionOfFa = modified.indexOf("fa")
  while (positionOfFa !== -1) {
    const next = modified.charAt(positionOfFa + 2)
    const triple = "fa" + next
    modified =
      modified.slice(0, positionOfFa) +
      next +
      "िं" +
      modified.slice(positionOfFa + triple.length)
    positionOfFa = modified.indexOf("fa", positionOfFa + 2)
  }

  modified = modified.replace(/Ê/g, "ीZ")

  let wrongEe = modified.indexOf("ि्")
  while (wrongEe !== -1) {
    const consonent = modified.charAt(wrongEe + 2)
    const pair = "ि्" + consonent
    modified =
      modified.slice(0, wrongEe) +
      "्" +
      consonent +
      "ि" +
      modified.slice(wrongEe + pair.length)
    wrongEe = modified.indexOf("ि्", wrongEe + 2)
  }

  let positionOfR = modified.indexOf("Z")
  while (positionOfR > 0) {
    let halfR = positionOfR - 1
    let ch = modified.charAt(halfR)
    while (MATRAS.includes(ch)) {
      halfR -= 1
      ch = modified.charAt(halfR)
    }
    const span = modified.slice(halfR, positionOfR)
    const replacement = "र्" + span
    modified =
      modified.slice(0, halfR) +
      replacement +
      modified.slice(positionOfR + 1)
    positionOfR = modified.indexOf("Z")
  }

  return modified
}

/** True when text looks like Kruti Dev / DevLys ASCII glyphs (not Unicode Hindi). */
export function looksLikeKrutiDev(text: string): boolean {
  if (!text.trim()) return false
  if (/[\u0900-\u097F]/.test(text)) return false
  // All-caps Latin (NEW, RCC) and pure digits are never Kruti.
  if (!/[a-z]/.test(text) && !/[À-ÿƒ„…†‡ˆ‰Š‹ºí«îØÝæçÁôÄ³÷¥êëìïÈ¸ÜÞß¼½¿À¾Œ∙•¡ÃÅ]/.test(text)) {
    return false
  }
  return /[A-Za-zÀ-ÿƒ„…†‡ˆ‰Š‹ºí«îØÝæçÁôÄ³÷¥êëìïÈ¸ÜÞß¼½¿À¾Œ∙•¡ÃÅ]/.test(text)
}

export function isLegacyHindiFont(fontName: string | undefined): boolean {
  if (!fontName) return false
  const lower = fontName.toLowerCase()
  return lower.includes("kruti") || lower.includes("devlys")
}

/**
 * Convert Kruti Dev 010 / DevLys text to Unicode Devanagari.
 * Pass through unchanged when the string already contains Devanagari.
 */
export function krutiDevToUnicode(input: string): string {
  if (!input) return input
  if (/[\u0900-\u097F]/.test(input)) return input
  if (!looksLikeKrutiDev(input)) return input
  return replaceSymbols(input)
}

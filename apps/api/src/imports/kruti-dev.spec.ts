import {
  isLegacyHindiFont,
  krutiDevToUnicode,
  looksLikeKrutiDev,
} from "./kruti-dev"

describe("krutiDevToUnicode", () => {
  it("decodes Ward 5 owner and property-type glyphs", () => {
    expect(krutiDevToUnicode("okMZ ua0")).toBe("वार्ड नं0")
    expect(krutiDevToUnicode("okMZ ua0 11")).toBe("वार्ड नं0 11")
    expect(krutiDevToUnicode("iou dqekj")).toBe("पवन कुमार")
    expect(krutiDevToUnicode('gf"kZr tSu')).toBe("हर्षित जैन")
    expect(krutiDevToUnicode("vkoklh;")).toBe("आवासीय")
  })

  it("leaves Unicode Devanagari and plain ASCII numbers alone", () => {
    expect(krutiDevToUnicode("पिता/पति का नाम")).toBe("पिता/पति का नाम")
    expect(krutiDevToUnicode("वार्ड न०")).toBe("वार्ड न०")
    expect(krutiDevToUnicode("42")).toBe("42")
    expect(krutiDevToUnicode("NEW")).toBe("NEW")
  })

  it("detects legacy fonts and Kruti-looking text", () => {
    expect(isLegacyHindiFont("Kruti Dev 010")).toBe(true)
    expect(isLegacyHindiFont("DevLys 010")).toBe(true)
    expect(isLegacyHindiFont("Calibri")).toBe(false)
    expect(looksLikeKrutiDev("iqjkuk e0 ua0")).toBe(true)
    expect(looksLikeKrutiDev("पुराना म०न०")).toBe(false)
  })
})

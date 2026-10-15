import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { optionLabel } from "./option-labels.ts"

describe("option labels", () => {
  it("translates Residential without changing the stored value", () => {
    assert.equal(optionLabel("en", "Residential"), "Residential")
    assert.equal(optionLabel("hi", "Residential"), "आवासीय")
    assert.equal("Residential", "Residential")
  })

  it("leaves owner names and unknown text unchanged", () => {
    assert.equal(optionLabel("hi", "सीता देवी"), "सीता देवी")
    assert.equal(optionLabel("hi", "गांधी नगर"), "गांधी नगर")
    assert.equal(optionLabel("en", "SOME_NEW_CODE"), "SOME_NEW_CODE")
  })

  it("polishes known messy catalog values in English", () => {
    assert.equal(optionLabel("en", "rcc road"), "RCC Road")
    assert.equal(optionLabel("hi", "rcc road"), "आर.सी.सी. सड़क")
  })
})

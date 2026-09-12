import assert from "node:assert/strict"
import test from "node:test"

import {
  PROPERTY_USES,
  knownCatalogValue,
  withCurrentOption,
} from "./ward1-catalog"

test("knownCatalogValue keeps Excel catalog property uses", () => {
  assert.equal(
    knownCatalogValue(PROPERTY_USES, "Residential Self"),
    "Residential Self"
  )
  assert.equal(knownCatalogValue(PROPERTY_USES, "mixed"), "Mixed")
  assert.equal(knownCatalogValue(PROPERTY_USES, "  Open Land  "), "Open Land")
})

test("knownCatalogValue rejects Nagla Pajwa and other unknown values", () => {
  assert.equal(knownCatalogValue(PROPERTY_USES, "Nagla Pajwa"), "")
  assert.equal(knownCatalogValue(PROPERTY_USES, "Naglola Pajwa"), "")
  assert.equal(knownCatalogValue(PROPERTY_USES, "Main road"), "")
  assert.equal(knownCatalogValue(PROPERTY_USES, ""), "")
  assert.equal(knownCatalogValue(PROPERTY_USES, null), "")
  assert.equal(knownCatalogValue(PROPERTY_USES, undefined), "")
})

test("withCurrentOption still prepends unknown current values", () => {
  const options = withCurrentOption(PROPERTY_USES, "Nagla Pajwa")
  assert.equal(options[0], "Nagla Pajwa")
  assert.equal(options.includes("Residential Self"), true)
})

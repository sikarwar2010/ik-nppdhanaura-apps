import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { localeCookie, parseLocale } from "./locale.ts"
import { en } from "./messages/en.ts"
import { hi } from "./messages/hi.ts"
import { translate } from "./provider.tsx"

describe("locale", () => {
  it("defaults to English and keeps Hindi", () => {
    assert.equal(parseLocale(undefined), "en")
    assert.equal(parseLocale("hi"), "hi")
    assert.equal(parseLocale("fr"), "en")
    assert.match(localeCookie("hi"), /locale=hi/)
  })

  it("uses the same keys in English and Hindi", () => {
    assert.deepEqual(Object.keys(hi).sort(), Object.keys(en).sort())
  })

  it("translates interface labels and leaves the key set stable", () => {
    assert.equal(translate("en", "auth.email"), "Email")
    assert.equal(translate("hi", "auth.email"), "ईमेल")
    assert.equal(translate("hi", "survey.ownerName"), "नया मकान मालिक")
    assert.equal(
      translate("hi", "survey.previousOwnerName"),
      "पुराना मकान मालिक"
    )
    assert.notEqual(translate("hi", "survey.ownerName"), "सीता देवी")
  })
})

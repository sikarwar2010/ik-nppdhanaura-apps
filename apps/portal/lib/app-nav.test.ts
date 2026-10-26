import assert from "node:assert/strict"
import { test } from "node:test"

import { NAV_ITEMS, type NavItem } from "../components/app-nav"

function flatten(items: NavItem[]): NavItem[] {
  return items.flatMap((item) => [item, ...flatten(item.children ?? [])])
}

test("internal sidebar has no GIS & Public Data entries", () => {
  const all = flatten(NAV_ITEMS)
  const titles = all.map((item) => item.title)
  assert.ok(!titles.includes("GIS & Public Data"))
  assert.ok(!titles.includes("Ward Statistics"))
  assert.ok(!titles.includes("Public GIS Page"))
  assert.ok(all.every((item) => !(item.href ?? "").includes("/gis")))
})

test("tax administration lists the six pages in order", () => {
  const group = NAV_ITEMS.find((item) => item.title === "Tax Administration")
  assert.deepEqual(
    group?.children?.map((item) => [item.title, item.href]),
    [
      ["Assessment Years", "/tax-admin/assessment-years"],
      ["Tax Rates", "/tax-admin/tax-rates"],
      ["Property Tax Rebates", "/tax-admin/rebates/property"],
      ["Water Tax Rebates", "/tax-admin/rebates/water"],
      ["Property Tax Penalties", "/tax-admin/penalties/property"],
      ["Water Tax Penalties", "/tax-admin/penalties/water"],
    ]
  )
})

test("top-level groups keep the expected order", () => {
  assert.deepEqual(
    NAV_ITEMS.map((item) => item.title),
    ["Dashboard", "Survey", "Reports", "Tax Administration", "Tax Collection", "Settings", "Import"]
  )
})

test("every page link carries a permission", () => {
  for (const item of flatten(NAV_ITEMS)) {
    if (item.href) assert.ok(item.permission, `${item.title} has no permission`)
  }
})

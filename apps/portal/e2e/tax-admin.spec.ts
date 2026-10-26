/**
 * Tax Administration end-to-end checks against a running API + local
 * (non-production) database. Signs in with the local seed admin from
 * apps/api/.env; skipped when those values are not available.
 *
 *   PLAYWRIGHT_BASE_URL=http://localhost:3100 npx playwright test e2e/tax-admin.spec.ts
 *
 * These tests write draft/approved rules and year dates. Run them only on a
 * disposable database (take a pg_dump first and restore it afterwards).
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

function seedAdmin(): { email: string; password: string } | null {
  const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../api/.env")
  if (!fs.existsSync(file)) return null
  const env = Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter((line) => /^[A-Z_]+=/.test(line))
      .map((line) => {
        const i = line.indexOf("=")
        return [line.slice(0, i), line.slice(i + 1).replace(/^["']|["']$/g, "")]
      })
  )
  const email = process.env.E2E_ADMIN_EMAIL ?? env.SEED_ADMIN_EMAIL
  const password = process.env.E2E_ADMIN_PASSWORD ?? env.SEED_ADMIN_PASSWORD
  return email && password ? { email, password } : null
}

const admin = seedAdmin()
test.skip(!admin, "No local seed admin credentials")
test.describe.configure({ mode: "serial" })

async function login(page: Page) {
  await page.goto("/login")
  await page.locator("#email").fill(admin!.email)
  await page.locator("#password").fill(admin!.password)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 20_000 })
}

const PAGES = [
  ["/tax-admin/assessment-years", "Assessment Years"],
  ["/tax-admin/tax-rates", "Tax Rates"],
  ["/tax-admin/rebates/property", "Property tax Rebates"],
  ["/tax-admin/rebates/water", "Water tax Rebates"],
  ["/tax-admin/penalties/property", "Property tax Penalties"],
  ["/tax-admin/penalties/water", "Water tax Penalties"],
] as const

test.beforeEach(async ({ page }) => {
  await login(page)
})

test("13: sidebar has no GIS & Public Data group and lists the six tax pages", async ({ page }) => {
  await page.goto("/tax-admin/assessment-years")
  const sidebar = page.locator('[data-sidebar="sidebar"]').first()
  await expect(sidebar.getByText("GIS & Public Data")).toHaveCount(0)
  await expect(sidebar.getByText("Ward Statistics")).toHaveCount(0)
  await expect(sidebar.getByText("Public GIS Page")).toHaveCount(0)
  for (const label of [
    "Assessment Years",
    "Tax Rates",
    "Property Tax Rebates",
    "Water Tax Rebates",
    "Property Tax Penalties",
    "Water Tax Penalties",
  ]) {
    await expect(sidebar.getByRole("link", { name: label, exact: true })).toBeVisible()
  }
  await expect(sidebar.getByRole("link", { name: "Assessment Years", exact: true })).toHaveAttribute("data-active", /.*/)
})

test("1: assessment-year form validates before saving", async ({ page }) => {
  await page.goto("/tax-admin/assessment-years")
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Assessment Years")
  await expect(page.getByRole("cell", { name: /dates locked|demands/ }).first()).toBeVisible()
  await page.getByRole("button", { name: "New assessment year" }).click()
  await page.locator("#ay-label").fill("2025-2026")
  await expect(page.getByText("This assessment year already exists.")).toBeVisible()
  await page.locator("#ay-label").fill("2090-2092")
  await expect(page.getByText("The second year must follow the first.")).toBeVisible()
  await page.locator("#ay-label").fill("2090-2091")
  await page.locator("#ay-start").fill("2091-03-31")
  await page.locator("#ay-end").fill("2090-04-01")
  await expect(page.getByText("The end date is before the start date.")).toBeVisible()
  await expect(page.getByRole("button", { name: "Create year…" })).toBeDisabled()
})

test("1: set dates for a year, and the server rejects an overlapping year", async ({ page }) => {
  await page.goto("/tax-admin/assessment-years")
  const row = page.getByRole("row", { name: /2025-2026/ })
  await row.getByRole("button", { name: /Set dates|Edit/ }).click()
  await page.locator("#ay-start").fill("2025-04-01")
  await page.locator("#ay-end").fill("2026-03-31")
  await page.locator("#ay-status").selectOption("ACTIVE")
  await page.getByRole("button", { name: "Save changes…" }).click()
  await page.getByRole("dialog").getByRole("button", { name: "Save" }).click()
  await expect(page.getByText("Assessment year saved")).toBeVisible()
  await expect(page.getByRole("row", { name: /2025-2026/ })).toContainText("Active")

  const next = page.getByRole("row", { name: /2026-2027/ })
  await next.getByRole("button", { name: /Set dates|Edit/ }).click()
  await page.locator("#ay-start").fill("2026-01-01")
  await page.locator("#ay-end").fill("2026-12-31")
  await page.getByRole("button", { name: "Save changes…" }).click()
  await page.getByRole("dialog").getByRole("button", { name: "Save" }).click()
  await expect(page.getByText(/overlap/i)).toBeVisible()
})

test("3: tax-rate preview shows the server's formula steps", async ({ page }) => {
  await page.goto("/tax-admin/tax-rates")
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Tax Rates")
  await expect(page.getByRole("table").last().locator("tbody tr")).toHaveCount(25)
  const preview = page.getByRole("region", { name: "Calculation preview" })
  await expect(preview.getByText("Gross annual letting value (ALV)")).toBeVisible({ timeout: 15_000 })
  await expect(preview.getByText(/sq ft × ₹.* × 12 months/)).toBeVisible()
  await expect(preview.getByText(/Estimate from the server/)).toBeVisible()
})

test("4–6: property and water rebates are separate, previewed and approved with a reason", async ({ page }) => {
  await page.goto("/tax-admin/rebates/property")
  await page.locator("#pol-year").selectOption({ label: /2025-2026/ as unknown as string }).catch(async () => {
    const option = await page.locator("#pol-year option", { hasText: "2025-2026" }).getAttribute("value")
    await page.locator("#pol-year").selectOption(option!)
  })
  await page.locator("#f-name").fill("E2E property rebate")
  await page.locator("#f-rate").fill("10")
  const preview = page.getByRole("region", { name: "Preview" })
  // Sample: current property tax ₹2,000 → ₹200 rebate; water tax not affected.
  await expect(preview.getByText("₹200.00").first()).toBeVisible({ timeout: 15_000 })
  await expect(preview.getByText(/Other taxes are not included|other taxes are not included/)).toBeVisible()
  await page.getByRole("button", { name: "Save as draft" }).click()
  await expect(page.getByText(/Draft saved/)).toBeVisible()
  const row = page.getByRole("row", { name: /E2E property rebate/ })
  await row.getByRole("button", { name: "Approve…" }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog.getByRole("button", { name: "Approve & activate" })).toBeDisabled()
  await dialog.getByRole("textbox").fill("E2E approval ref 1")
  await dialog.getByRole("button", { name: "Approve & activate" }).click()
  await expect(page.getByRole("row", { name: /E2E property rebate/ })).toContainText("Active")

  await page.getByRole("link", { name: "Water tax rebates", exact: true }).click()
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Water tax Rebates")
  const year = await page.locator("#pol-year option", { hasText: "2025-2026" }).getAttribute("value")
  await page.locator("#pol-year").selectOption(year!)
  await page.locator("#f-name").fill("E2E water rebate")
  await page.locator("#f-rate").fill("5")
  await expect(page.getByRole("region", { name: "Preview" }).getByText("₹75.00").first()).toBeVisible({ timeout: 15_000 })
  await page.getByRole("button", { name: "Save as draft" }).click()
  await page.getByRole("row", { name: /E2E water rebate/ }).getByRole("button", { name: "Approve…" }).click()
  await page.getByRole("dialog").getByRole("textbox").fill("E2E approval ref 2")
  await page.getByRole("dialog").getByRole("button", { name: "Approve & activate" }).click()
  await expect(page.getByRole("row", { name: /E2E water rebate/ })).toContainText("Active")

  // Activating the water rule did not archive the property rule.
  await page.getByRole("link", { name: "Property tax rebates", exact: true }).click()
  await page.locator("#pol-year").selectOption(year!)
  await expect(page.getByRole("row", { name: /E2E property rebate/ })).toContainText("Active")
})

test("7: water-tax penalty preview uses only water tax", async ({ page }) => {
  await page.goto("/tax-admin/penalties/water")
  const year = await page.locator("#pol-year option", { hasText: "2025-2026" }).getAttribute("value")
  await page.locator("#pol-year").selectOption(year!)
  await page.locator("#f-name").fill("E2E water penalty")
  await page.locator("#f-rate").fill("2")
  // Sample water tax ₹1,500 × 2% = ₹30.00
  await expect(page.getByRole("region", { name: "Preview" }).getByText("₹30.00").first()).toBeVisible({ timeout: 15_000 })
})

test("15: the six pages fit 360–1440 px without horizontal overflow", async ({ page }) => {
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const [route] of PAGES) {
      await page.goto(route)
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow, `${route} at ${width}px`).toBeLessThanOrEqual(0)
    }
  }
})

test("accessibility: no serious or critical axe findings on the six pages", async ({ page }) => {
  for (const [route] of PAGES) {
    await page.goto(route)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await page.waitForLoadState("networkidle")
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze()
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
    expect(
      serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`),
      route
    ).toEqual([])
  }
})

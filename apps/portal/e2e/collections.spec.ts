/**
 * Counter collection end-to-end on a disposable database. Seed one unpaid
 * property first and pass its survey ID:
 *
 *   DATABASE_URL=…/npdh_it pnpm --filter api exec tsx test/fixtures/seed-collection-e2e.ts
 *   E2E_COLLECTION_PROPERTY=<printed id> PLAYWRIGHT_BASE_URL=http://localhost:3100 \
 *     npx playwright test e2e/collections.spec.ts
 *
 * Posts a real ₹3,000 payment, so never point it at production.
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
const propertyId = process.env.E2E_COLLECTION_PROPERTY
test.skip(!admin || !propertyId, "Needs local seed admin and E2E_COLLECTION_PROPERTY")
test.describe.configure({ mode: "serial" })

async function login(page: Page) {
  await page.goto("/login")
  await page.locator("#email").fill(admin!.email)
  await page.locator("#password").fill(admin!.password)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 20_000 })
}

test.beforeEach(async ({ page }) => {
  await login(page)
})

let ledgerUrl = ""

test("A: guided partial payment — ₹3,000 of ₹5,000, receipt issued, ₹2,000 remains", async ({ page }) => {
  await page.goto("/collections")
  await expect(page.getByLabel("Search in ward / वार्ड में खोजें")).toBeVisible()
  await page.getByLabel("Search property / संपत्ति खोजें").fill(propertyId!)
  await page.getByRole("list", { name: "Matching properties" }).getByRole("button").first().click()

  await expect(page.getByText("Outstanding now")).toBeVisible()
  await expect(page.getByText("₹5,000.00").first()).toBeVisible()
  await page.getByRole("button", { name: /Details are correct/ }).click()

  // Client checks before anything is sent.
  await page.getByRole("button", { name: /Review allocation/ }).click()
  await expect(page.getByText(/Enter the amount received/)).toBeVisible()
  await page.getByLabel(/Amount received/).fill("5000.01")
  await page.getByRole("button", { name: /Review allocation/ }).click()
  await expect(page.getByText(/Above the outstanding/)).toBeVisible()

  await expect(page.getByRole("list", { name: "Tax categories due" })).toContainText("Water tax")
  // A time later than now is refused before review.
  await page.getByLabel(/Payment time/).fill("23:59")
  await page.getByLabel(/Amount received/).fill("3000")
  await page.getByRole("button", { name: /Review allocation/ }).click()
  if (new Date().getUTCHours() * 60 + new Date().getUTCMinutes() + 330 < 23 * 60 + 59) {
    await expect(page.getByText(/cannot be later than now/)).toBeVisible()
  }
  await page.getByLabel(/Payment time/).fill("")
  await page.getByRole("button", { name: /Review allocation/ }).click()
  const review = page.getByRole("region", { name: /Review & post/ })
  await expect(review.getByText("Remaining after payment")).toBeVisible()
  await expect(review.getByText("₹2,000.00").first()).toBeVisible()
  await expect(review.getByText("Partially paid / आंशिक")).toBeVisible()
  const row = review.getByRole("row", { name: /2193-2194/ })
  await expect(row).toContainText("₹1,000.00") // property tax
  await expect(row).toContainText("₹2,000.00") // water tax

  await review.getByRole("button", { name: /Post payment of ₹3,000.00/ }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toContainText("Amount received")
  await expect(dialog).toContainText("₹2,000.00")
  await expect(dialog).toContainText("Partially paid")
  await dialog.getByRole("button", { name: /Confirm and post ₹3,000.00/ }).click()
  const done = page.getByRole("region", { name: /Receipt/ })
  await expect(done.getByText(/Payment posted/)).toBeVisible()
  await expect(done.getByText(/^RCP-/)).toBeVisible()
  await expect(done.getByText("Remaining outstanding")).toBeVisible()

  const consumer = page.waitForResponse((res) => res.url().includes("copy=consumer") && res.status() === 200)
  await done.getByRole("button", { name: "Consumer copy" }).click()
  const html = (await (await consumer).json()).data.html as string
  expect(html).toContain("CONSUMER COPY")
  expect(html).toContain("PARTIAL PAYMENT RECEIVED")
  expect(html).not.toContain("Office reconciliation")

  const office = page.waitForResponse((res) => res.url().includes("copy=office") && res.status() === 200)
  await done.getByRole("button", { name: "Office copy" }).click()
  expect((await (await office).json()).data.html).toContain("Office reconciliation")

  await done.getByRole("link", { name: /View ledger/ }).click()
  await expect(page).toHaveURL(/\/collections\/ledger\?surveyId=/)
  ledgerUrl = page.url()
})

test("ledger shows the payment, the ₹2,000 balance and agrees with the engine", async ({ page }) => {
  await page.goto(ledgerUrl)
  await expect(page.getByText(/Ledger agrees with the outstanding calculation \(₹2,000.00\)/)).toBeVisible()
  const payment = page.getByRole("row", { name: /Payment \/ भुगतान/ })
  await expect(payment).toContainText("₹3,000.00")
  await expect(payment).toContainText("₹2,000.00")
  await expect(page.getByText(/Years still unpaid: 2193-2194 \(₹2,000.00\)/)).toBeVisible()

  await page.getByLabel("Tax").selectOption("waterTax")
  await expect(page.getByRole("row", { name: /Payment \/ भुगतान/ })).toContainText("Water ₹2,000.00")
})

test("year-end preview reconciles without closing anything", async ({ page }) => {
  await page.goto("/collections/year-end")
  await expect(page.getByRole("heading", { name: /Year-end carry-forward/ })).toBeVisible()
  await expect(page.getByText("Reconciles").first()).toBeVisible()
})

const PAGES = ["/collections", "/collections/receipts", "/collections/dues", "/collections/year-end"]

test("collection pages fit 360–1440 px without horizontal page scroll", async ({ page }) => {
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of [...PAGES, ledgerUrl.replace(/^https?:\/\/[^/]+/, "")]) {
      await page.goto(route)
      await page.waitForLoadState("networkidle")
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow, `${route} at ${width}px`).toBeLessThanOrEqual(0)
    }
  }
})

test("accessibility: no serious or critical axe findings", async ({ page }) => {
  for (const route of [...PAGES, ledgerUrl.replace(/^https?:\/\/[^/]+/, "")]) {
    await page.goto(route)
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

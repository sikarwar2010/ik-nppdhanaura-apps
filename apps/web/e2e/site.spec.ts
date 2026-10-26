import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

import { keyRoutes, routes } from "./routes"

async function setLocale(page: Page, locale: "hi" | "en") {
  const url = new URL(test.info().project.use.baseURL!)
  await page.context().addCookies([{ name: "locale", value: locale, domain: url.hostname, path: "/" }])
}

test.describe("routes", () => {
  for (const route of routes) {
    test(`renders ${route}`, async ({ page }) => {
      const errors: string[] = []
      page.on("pageerror", (e) => errors.push(e.message))
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()))
      const res = await page.goto(route)
      expect(res?.status()).toBe(200)
      await expect(page.locator("h1")).toHaveCount(1)
      await expect(page.locator("html")).toHaveAttribute("lang", "hi")
      await expect(page.getByRole("link", { name: /नगर पालिका परिषद, धनौरा/ }).first()).toBeVisible()
      // Every image must actually load.
      const broken = await page.evaluate(async () => {
        const imgs = [...document.images]
        for (const img of imgs) {
          img.loading = "eager"
          if (!img.complete) {
            await new Promise((resolve) => {
              img.addEventListener("load", resolve, { once: true })
              img.addEventListener("error", resolve, { once: true })
            })
          }
        }
        return imgs.filter((i) => i.naturalWidth === 0).map((i) => i.currentSrc || i.src)
      })
      expect(broken).toEqual([])
      expect(errors).toEqual([])
    })
  }

  test("unknown route shows the custom 404", async ({ page }) => {
    const res = await page.goto("/does-not-exist")
    expect(res?.status()).toBe(404)
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("पृष्ठ नहीं मिला")
    await expect(page.getByRole("link", { name: "मुख्य पृष्ठ पर जाएँ" })).toBeVisible()
  })

  test("legacy PHP URLs redirect", async ({ page }) => {
    await page.goto("/public/about.php")
    await expect(page).toHaveURL(/\/about$/)
    await page.goto("/public/notice.php?id=1")
    await expect(page).toHaveURL(/\/notices\/dhanaura-cricket-tournament-2026/)
    await page.goto("/staff")
    await expect(page).toHaveURL(/\/administration$/)
  })

  test("sitemap and robots are served", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml")
    expect(sitemap.ok()).toBeTruthy()
    expect(await sitemap.text()).toContain("/notices/dhanaura-cricket-tournament-2026")
    const robots = await request.get("/robots.txt")
    expect(await robots.text()).toContain("Sitemap:")
  })
})

test.describe("internal links", () => {
  test("every internal link on every page resolves", async ({ page, request }) => {
    const seen = new Set<string>()
    for (const route of routes) {
      await page.goto(route)
      const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href")!))
      for (const href of hrefs) {
        if (!href.startsWith("/") || href.startsWith("//")) continue
        const path = href.split("#")[0]!
        if (!path || seen.has(path)) continue
        seen.add(path)
        const res = await request.get(path)
        expect(res.status(), `${path} linked from ${route}`).toBeLessThan(400)
      }
    }
    expect(seen.size).toBeGreaterThan(20)
  })

  test("external links open safely in a new tab", async ({ page }) => {
    await page.goto("/services/birth-death-certificate")
    const external = page.locator('main a[href^="http"]')
    expect(await external.count()).toBeGreaterThan(0)
    for (const link of await external.all()) {
      await expect(link).toHaveAttribute("target", "_blank")
      await expect(link).toHaveAttribute("rel", /noopener/)
    }
  })
})

test.describe("navigation", () => {
  test("desktop dropdown works with the keyboard", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto("/")
    const trigger = page.getByRole("button", { name: "नागरिक सेवाएँ" })
    await trigger.focus()
    await page.keyboard.press("Enter")
    await expect(trigger).toHaveAttribute("aria-expanded", "true")
    const item = page.getByRole("link", { name: /संपत्ति कर खोज/ }).first()
    await expect(item).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(trigger).toHaveAttribute("aria-expanded", "false")
    await expect(trigger).toBeFocused()
    await trigger.click()
    await page.getByRole("link", { name: /सरकारी योजनाएं/ }).first().click()
    await expect(page).toHaveURL(/\/schemes$/)
  })

  test("mobile drawer opens, traps focus, closes and navigates", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/")
    const open = page.getByRole("button", { name: "मेनू" })
    await open.click()
    const dialog = page.getByRole("dialog", { name: "मेनू" })
    await expect(dialog).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(dialog).toBeHidden()
    await expect(open).toBeFocused()
    await open.click()
    await dialog.getByRole("link", { name: "संपर्क" }).click()
    await expect(page).toHaveURL(/\/contact$/)
    await expect(dialog).toBeHidden()
  })

  test("skip link moves focus to main content", async ({ page }) => {
    await page.goto("/about")
    await page.keyboard.press("Tab")
    const skip = page.getByRole("link", { name: "मुख्य सामग्री पर जाएँ" })
    await expect(skip).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(page).toHaveURL(/#main-content$/)
  })
})

test.describe("language", () => {
  test("Hindi is the default and English persists across routes", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("html")).toHaveAttribute("lang", "hi")
    await expect(page.getByRole("heading", { level: 1 })).toContainText("धनौरा नगर पालिका परिषद")
    await page.getByRole("button", { name: "Switch to English" }).click()
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome to Nagar Palika Parishad Dhanaura")
    await expect(page.locator("html")).toHaveAttribute("lang", "en")
    await page.goto("/services/trade-license")
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Trade License")
    await page.goto("/notices/dhanaura-cricket-tournament-2026")
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Dhanaura Cricket Tournament")
    await page.getByRole("button", { name: "हिंदी में देखें" }).click()
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("धनौरा क्रिकेट खेल-प्रतियोगिता")
  })

  test("text size control persists", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "अक्षर बड़े करें" }).click()
    await expect(page.locator("html")).toHaveAttribute("data-text-size", "lg")
    await page.goto("/about")
    await expect(page.locator("html")).toHaveAttribute("data-text-size", "lg")
    await page.getByRole("button", { name: "सामान्य अक्षर" }).click()
    await expect(page.locator("html")).not.toHaveAttribute("data-text-size", /.+/)
  })
})

test.describe("search", () => {
  test("finds Hindi and English content and shows snippets", async ({ page }) => {
    await page.goto("/")
    const box = page.getByRole("searchbox", { name: "वेबसाइट में खोजें" }).first()
    await box.fill("जन्म प्रमाण")
    await box.press("Enter")
    await expect(page).toHaveURL(/\/search\?q=/)
    await expect(page.getByRole("link", { name: /जन्म\/मृत्यु प्रमाण पत्र/ }).first()).toBeVisible()
    await expect(page.locator("mark").first()).toBeVisible()

    await page.goto("/search?q=cricket")
    await expect(page.getByRole("link", { name: /क्रिकेट/ }).first()).toBeVisible()

    await page.goto("/search?q=फीस") // nukta-insensitive: source spells it फ़ीस
    await expect(page.getByRole("link", { name: /क्रिकेट/ }).first()).toBeVisible()
  })

  test("no-results and empty states", async ({ page }) => {
    await page.goto("/search?q=zzzxqy")
    await expect(page.getByText("कोई परिणाम नहीं मिला")).toBeVisible()
    await page.goto("/search")
    await expect(page.getByText(/खोजने के लिए कोई शब्द लिखें/)).toBeVisible()
  })
})

test.describe("gallery", () => {
  test("lightbox supports keyboard and returns focus", async ({ page }) => {
    await page.goto("/gallery/independence-day-2026")
    const thumbs = page.getByRole("button", { name: /बड़ा करके देखें/ })
    await expect(thumbs).toHaveCount(6)
    await thumbs.first().focus()
    await page.keyboard.press("Enter")
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText("1 में से 6")
    await page.keyboard.press("ArrowRight")
    await expect(dialog).toContainText("2 में से 6")
    await page.keyboard.press("ArrowLeft")
    await page.keyboard.press("ArrowLeft")
    await expect(dialog).toContainText("6 में से 6")
    await page.keyboard.press("Escape")
    await expect(dialog).toBeHidden()
    await expect(thumbs.last()).toBeFocused()
  })
})

test.describe("contact map", () => {
  test("map loads only on request", async ({ page }) => {
    await page.goto("/contact")
    await expect(page.locator("iframe")).toHaveCount(0)
    await page.getByRole("button", { name: "नक्शा दिखाएँ" }).click()
    await expect(page.locator("iframe")).toHaveAttribute(
      "src",
      "https://www.google.com/maps?q=Nagar%20Palika%20Parishad%20Dhanaura&z=16&output=embed"
    )
  })
})

test.describe("responsive layout", () => {
  for (const width of [360, 390, 768, 1024, 1440]) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      for (const route of keyRoutes) {
        await page.goto(route)
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
        expect(overflow, `${route} at ${width}px`).toBeLessThanOrEqual(0)
        // Brand block and menu controls must not overlap.
        const brand = await page.locator("header a[href='/']").first().boundingBox()
        const search = await page.locator("#header-search").boundingBox()
        if (brand && search && (await page.locator("#header-search").isVisible())) {
          expect(brand.x + brand.width, `${route} brand/search overlap`).toBeLessThanOrEqual(search.x)
        }
      }
    })
  }

  test("touch targets in the mobile header are at least 44px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto("/")
    const menu = await page.getByRole("button", { name: "मेनू" }).boundingBox()
    expect(menu!.height).toBeGreaterThanOrEqual(44)
  })
})

test.describe("accessibility (axe, WCAG 2.2 A/AA rules)", () => {
  for (const locale of ["hi", "en"] as const) {
    for (const route of keyRoutes) {
      test(`${locale} ${route}`, async ({ page }) => {
        await setLocale(page, locale)
        await page.goto(route)
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze()
        const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
        expect(
          serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`),
          `${route} (${locale})`
        ).toEqual([])
      })
    }
  }
})

test.describe("GIS ward dashboard", () => {
  test("shows ward aggregates, filters by ward and hides personal data", async ({ page }) => {
    await page.goto("/gis")
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("GIS एवं वार्ड-वार कर पारदर्शिता")
    await expect(page.getByText(/वार्ड सीमाओं का डिजिटल नक्शा अभी उपलब्ध नहीं है/)).toBeVisible()
    await expect(page.getByText("₹4,15,800").first()).toBeVisible()
    await expect(page.getByRole("progressbar").first()).toHaveAttribute("aria-valuetext", "90 / 120")
    await expect(page.getByText(/अभी कोई सर्वे दर्ज नहीं/)).toBeVisible()
    await expect(page.getByText(/सार्वजनिक प्रकटीकरण की स्वीकृति/)).toBeVisible()
    await expect(page.getByRole("table")).toContainText("₹3,40,200.00")

    await page.locator("select[name=ward]").selectOption("2")
    await page.getByRole("button", { name: "दिखाएँ" }).click()
    await expect(page).toHaveURL(/ward=2/)
    await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(1)
    await expect(page.getByRole("table")).toContainText("₹75,600.00")
  })

  test("unknown year shows an honest empty state", async ({ page }) => {
    await page.goto("/gis?year=1999-2000")
    await expect(page.getByText("चुने गए वर्ष की कोई मांग प्रकाशित नहीं है।")).toBeVisible()
  })
})


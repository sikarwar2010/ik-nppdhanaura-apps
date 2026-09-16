import { Logger } from "@nestjs/common"

const logger = new Logger("DemandNoticePdf")

const INSTALL_HINT =
  "From apps/api run: pnpm exec playwright install chromium  (then restart the API)."

function isMissingBrowserError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return (
    message.includes("Executable doesn't exist") ||
    message.includes("browserType.launch") ||
    message.includes("Could not find browser")
  )
}

/**
 * Render combined A4 portrait PDF from HTML (one notice page per CSS .page).
 * Uses Playwright Chromium when available.
 */
export async function renderDemandNoticePdfFromHtml(
  html: string
): Promise<Buffer> {
  let chromium: typeof import("playwright").chromium
  try {
    ;({ chromium } = await import("playwright"))
  } catch (err) {
    logger.error(`Playwright is not installed: ${String(err)}`)
    throw new Error(
      `PDF generation requires the Playwright package. ${INSTALL_HINT}`
    )
  }

  const executablePath =
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim() ||
    process.env.CHROMIUM_PATH?.trim() ||
    undefined

  let browser
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: executablePath || undefined,
      args: [
        "--font-render-hinting=none",
        "--disable-dev-shm-usage",
        "--no-sandbox",
      ],
    })
  } catch (err) {
    logger.error(`Playwright launch failed: ${String(err)}`)
    if (isMissingBrowserError(err)) {
      throw new Error(
        `Chromium browser for PDF generation is not installed. ${INSTALL_HINT}`
      )
    }
    throw err instanceof Error ? err : new Error(String(err))
  }

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle" })
    const pdf = await page.pdf({
      format: "A4",
      landscape: false,
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}

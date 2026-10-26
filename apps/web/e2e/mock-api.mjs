// Minimal stand-in for the municipal API, used only by the e2e suite.
// Serves TEST fixture data for /api/v1/public/ward-stats. Never deploy this.
import http from "node:http"

const port = Number(process.env.MOCK_API_PORT ?? 4199)

const wards = [
  { wardNumber: 1, wardName: "TEST वार्ड एक", propertiesSurveyed: 120, propertiesWithPublishedDemand: 90, demandCoveragePct: 75, propertyTax: "216000.00", waterTax: "162000.00", drainageTax: "0.00", penalty: "0.00", rebate: "37800.00", totalDemand: "340200.00" },
  { wardNumber: 2, wardName: "TEST वार्ड दो", propertiesSurveyed: 80, propertiesWithPublishedDemand: 20, demandCoveragePct: 25, propertyTax: "48000.00", waterTax: "36000.00", drainageTax: "0.00", penalty: "0.00", rebate: "8400.00", totalDemand: "75600.00" },
  { wardNumber: 3, wardName: "TEST वार्ड तीन", propertiesSurveyed: 0, propertiesWithPublishedDemand: 0, demandCoveragePct: null, propertyTax: "0.00", waterTax: "0.00", drainageTax: "0.00", penalty: "0.00", rebate: "0.00", totalDemand: "0.00" },
]

const body = {
  success: true,
  data: {
    assessmentYear: { id: "y2025", code: "2025-2026", name: "2025-2026" },
    years: [
      { id: "y2025", code: "2025-2026", name: "2025-2026" },
      { id: "y2024", code: "2024-2025", name: "2024-2025" },
    ],
    generatedAt: "2026-10-26T06:00:00.000Z",
    basis: "TEST FIXTURE — published and verified demands on the municipal ledger.",
    disclosure: { collections: false },
    geometryAvailable: false,
    totals: {
      wards: 3,
      wardsWithSurveys: 2,
      propertiesSurveyed: 200,
      propertiesWithPublishedDemand: 110,
      demandCoveragePct: 55,
      propertyTax: "264000.00",
      waterTax: "198000.00",
      drainageTax: "0.00",
      penalty: "0.00",
      rebate: "46200.00",
      totalDemand: "415800.00",
    },
    wards,
  },
}

http
  .createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost")
    if (url.pathname === "/health") {
      res.writeHead(200).end("ok")
      return
    }
    if (url.pathname === "/api/v1/public/ward-stats") {
      const year = url.searchParams.get("assessmentYear")
      if (year && !["2025-2026", "2024-2025", "y2025", "y2024"].includes(year)) {
        res.writeHead(404, { "content-type": "application/json" })
        res.end(JSON.stringify({ success: false }))
        return
      }
      res.writeHead(200, { "content-type": "application/json" })
      res.end(JSON.stringify(body))
      return
    }
    res.writeHead(404).end()
  })
  .listen(port, "127.0.0.1")

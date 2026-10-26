import { Injectable, NotFoundException } from "@nestjs/common"
import { Prisma } from "@prisma/client"

import { moneyString } from "../demands/money"
import { PrismaService } from "../prisma/prisma.service"

import {
  buildPublicWardStats,
  collectionsDisclosed,
  type DemandSums,
  type PublicWardStatsResponse,
} from "./ward-stats"

const CACHE_MS = 5 * 60_000

@Injectable()
export class PublicWardStatsService {
  private cache = new Map<string, { at: number; value: PublicWardStatsResponse }>()

  constructor(private readonly prisma: PrismaService) {}

  async stats(assessmentYearId?: string): Promise<PublicWardStatsResponse> {
    const key = assessmentYearId?.trim() || "latest"
    const hit = this.cache.get(key)
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.value
    const value = await this.load(assessmentYearId?.trim() || null)
    this.cache.set(key, { at: Date.now(), value })
    return value
  }

  private async load(requestedYearId: string | null): Promise<PublicWardStatsResponse> {
    // Years that have at least one published, verified demand on the ledger.
    const yearRows = await this.prisma.$queryRaw<
      Array<{ id: string; code: string; name: string }>
    >`
      SELECT DISTINCT y.id, y.code, y.name
      FROM assessment_demand d
      INNER JOIN reference_entry y ON y.id = d."assessmentYearId"
      WHERE d.status::text = 'PUBLISHED' AND d."verificationStatus"::text = 'VERIFIED'
      ORDER BY y.code DESC
    `
    const years = yearRows.map((y) => ({ id: y.id, code: y.code, name: y.name }))
    let year = years[0] ?? null
    if (requestedYearId) {
      year = years.find((y) => y.id === requestedYearId || y.code === requestedYearId) ?? null
      if (!year) {
        throw new NotFoundException({
          code: "ASSESSMENT_YEAR_NOT_PUBLISHED",
          message: "No published demands exist for this assessment year",
        })
      }
    }

    const [wards, surveyed] = await Promise.all([
      this.prisma.ward.findMany({
        where: { isActive: true },
        select: { id: true, number: true, name: true },
      }),
      this.prisma.survey.groupBy({
        by: ["wardId"],
        where: { status: "ACTIVE", deletedAt: null },
        _count: { _all: true },
      }),
    ])

    const demandsByWard = new Map<string, DemandSums>()
    if (year) {
      const rows = await this.prisma.$queryRaw<
        Array<{
          ward_id: string
          demands: bigint
          property_tax: Prisma.Decimal
          water_tax: Prisma.Decimal
          drainage_tax: Prisma.Decimal
          penalty: Prisma.Decimal
          rebate: Prisma.Decimal
          net_demand: Prisma.Decimal
          collected: Prisma.Decimal
        }>
      >`
        SELECT
          d."wardId" AS ward_id,
          COUNT(DISTINCT d."surveyId") AS demands,
          COALESCE(SUM(CASE WHEN d."balanceKind"::text = 'COMPONENTS' THEN d."propertyTax" ELSE 0 END), 0) AS property_tax,
          COALESCE(SUM(CASE WHEN d."balanceKind"::text = 'COMPONENTS' THEN d."waterTax" ELSE 0 END), 0) AS water_tax,
          COALESCE(SUM(CASE WHEN d."balanceKind"::text = 'COMPONENTS' THEN d."drainageTax" ELSE 0 END), 0) AS drainage_tax,
          COALESCE(SUM(CASE WHEN d."balanceKind"::text = 'COMPONENTS' THEN d.penalty ELSE 0 END), 0) AS penalty,
          COALESCE(SUM(d."rebateAmount"), 0) AS rebate,
          COALESCE(SUM(
            d."currentYearDemand" + d.interest + COALESCE(adj.debits, 0)
            - d."rebateAmount" - COALESCE(adj.credits, 0)
          ), 0) AS net_demand,
          COALESCE(SUM(COALESCE(paid.paid, 0) + d."historicalPayments"), 0) AS collected
        FROM assessment_demand d
        LEFT JOIN (
          SELECT "assessmentDemandId" AS demand_id,
            SUM(CASE WHEN kind::text = 'CREDIT' THEN amount ELSE 0 END) AS credits,
            SUM(CASE WHEN kind::text = 'DEBIT' THEN amount ELSE 0 END) AS debits
          FROM demand_adjustment
          GROUP BY "assessmentDemandId"
        ) adj ON adj.demand_id = d.id
        LEFT JOIN (
          SELECT a."assessmentDemandId" AS demand_id, SUM(a.amount) AS paid
          FROM payment_allocation a
          INNER JOIN payment p ON p.id = a."paymentId"
          WHERE a.status::text = 'ACTIVE'
            AND p.status::text = 'SUCCESS'
            AND (p.gateway IS NULL OR p.gateway <> 'sandbox')
          GROUP BY a."assessmentDemandId"
        ) paid ON paid.demand_id = d.id
        WHERE d.status::text = 'PUBLISHED'
          AND d."verificationStatus"::text = 'VERIFIED'
          AND d."assessmentYearId" = ${year.id}
        GROUP BY d."wardId"
      `
      for (const row of rows) {
        demandsByWard.set(row.ward_id, {
          wardId: row.ward_id,
          demands: Number(row.demands),
          propertyTax: moneyString(row.property_tax.toString()),
          waterTax: moneyString(row.water_tax.toString()),
          drainageTax: moneyString(row.drainage_tax.toString()),
          penalty: moneyString(row.penalty.toString()),
          rebate: moneyString(row.rebate.toString()),
          netDemand: moneyString(row.net_demand.toString()),
          collected: moneyString(row.collected.toString()),
        })
      }
    }

    const disclose = collectionsDisclosed()
    const built = buildPublicWardStats({
      wards,
      surveyedByWard: new Map(surveyed.map((s) => [s.wardId, s._count._all])),
      demandsByWard,
      discloseCollections: disclose,
    })
    return {
      assessmentYear: year,
      years,
      generatedAt: new Date().toISOString(),
      basis: year
        ? `Published and verified demands on the municipal ledger for assessment year ${year.name}. Total demand = current-year tax + penalty + interest + approved debits − rebate − approved credits, before payments. Properties surveyed counts all active survey records.`
        : "No demand has been published yet. Properties surveyed counts all active survey records.",
      disclosure: { collections: disclose },
      geometryAvailable: false,
      totals: built.totals,
      wards: built.wards,
    }
  }
}

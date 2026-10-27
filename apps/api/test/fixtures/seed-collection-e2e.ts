/**
 * Test fixture for the portal collection e2e: one property with verified
 * history and an unpaid ₹5,000 demand (₹3,000 property + ₹2,000 water) in a
 * far-future test year. Refuses to run unless DATABASE_URL names a database
 * ending in "_it" (a disposable copy). Prints the property's survey ID.
 *
 *   DATABASE_URL=…/npdh_it pnpm exec tsx test/fixtures/seed-collection-e2e.ts
 */
import { createPrismaClient } from "../../src/prisma/prisma.client"

async function main() {
  const url = process.env.DATABASE_URL ?? ""
  const dbName = new URL(url.replace(/^postgres(ql)?:/, "http:")).pathname.slice(1)
  if (!dbName.endsWith("_it")) {
    throw new Error(`Refusing to seed "${dbName}": use a disposable database whose name ends in _it`)
  }
  const prisma = createPrismaClient()
  try {
    const category = await prisma.referenceCategory.findFirstOrThrow({ where: { code: "ASSESSMENT_YEAR" } })
    const code = "AY_2193_2194"
    const year =
      (await prisma.referenceEntry.findFirst({ where: { categoryId: category.id, code } })) ??
      (await prisma.referenceEntry.create({
        data: { categoryId: category.id, code, name: "2193-2194", status: "ACTIVE", sortOrder: 9002 },
      }))
    await prisma.assessmentYearProfile.upsert({
      where: { referenceEntryId: year.id },
      create: { referenceEntryId: year.id, startsOn: new Date("2193-04-01"), endsOn: new Date("2194-03-31"), status: "ACTIVE" },
      update: {},
    })
    const admin = await prisma.user.findFirstOrThrow({ orderBy: { createdAt: "asc" } })
    const survey = await prisma.survey.findFirstOrThrow({
      where: { deletedAt: null, status: "ACTIVE", demands: { none: {} }, payments: { none: {} } },
      orderBy: { surveyId: "asc" },
    })
    const earlier = await prisma.referenceEntry.findMany({
      where: { categoryId: category.id, code: { lt: code }, yearProfile: { isNot: null } },
    })
    const stamp = Date.now().toString(36)
    for (const entry of earlier) {
      await prisma.assessmentDemand.create({
        data: {
          surveyId: survey.id,
          wardId: survey.wardId,
          assessmentYearId: entry.id,
          demandReference: `E2E-${stamp}-${entry.code}`,
          status: "PUBLISHED",
          source: "OPENING_BALANCE",
          balanceKind: "CLOSING_ONLY",
          propertyTax: "0",
          waterTax: "0",
          drainageTax: "0",
          currentYearDemand: "0",
          verificationStatus: "VERIFIED",
          verifiedById: admin.id,
          verifiedAt: new Date(),
          publishedAt: new Date(),
          publishedById: admin.id,
        },
      })
    }
    await prisma.assessmentDemand.create({
      data: {
        surveyId: survey.id,
        wardId: survey.wardId,
        assessmentYearId: year.id,
        demandReference: `E2E-${stamp}-${code}`,
        status: "PUBLISHED",
        source: "CALCULATED",
        propertyTax: "3000.00",
        waterTax: "2000.00",
        drainageTax: "0",
        currentYearDemand: "5000.00",
        verificationStatus: "VERIFIED",
        publishedAt: new Date(),
        publishedById: admin.id,
      },
    })
    console.log(survey.surveyId)
  } finally {
    await prisma.$disconnect()
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

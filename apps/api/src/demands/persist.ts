import { Prisma } from "@prisma/client"

export type PublishedRow = {
  id: string
  propertyTax: Prisma.Decimal | string
  status: string
}

export function isUniqueConstraint(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  )
}

/**
 * Insert a published demand unless one already exists for the slot.
 * A unique-constraint loss returns the winner instead of a second row.
 */
export async function insertPublishedDemand<T extends PublishedRow>(input: {
  findPublished: () => Promise<T | null>
  create: () => Promise<T>
}): Promise<{ row: T; created: boolean }> {
  const existing = await input.findPublished()
  if (existing) return { row: existing, created: false }
  try {
    const row = await input.create()
    return { row, created: true }
  } catch (error) {
    if (!isUniqueConstraint(error)) throw error
    const winner = await input.findPublished()
    if (!winner) throw error
    return { row: winner, created: false }
  }
}

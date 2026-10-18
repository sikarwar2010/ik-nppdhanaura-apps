import { Prisma } from "@prisma/client"

import { insertPublishedDemand, isUniqueConstraint } from "./persist"

describe("published demand insert", () => {
  it("F: a second publish returns the existing demand", async () => {
    const existing = {
      id: "demand-1",
      propertyTax: "1500.00",
      status: "PUBLISHED",
    }
    let creates = 0
    const result = await insertPublishedDemand({
      findPublished: async () => existing,
      create: async () => {
        creates += 1
        return { id: "demand-2", propertyTax: "9999.00", status: "PUBLISHED" }
      },
    })
    expect(result.created).toBe(false)
    expect(result.row.id).toBe("demand-1")
    expect(result.row.propertyTax).toBe("1500.00")
    expect(creates).toBe(0)
  })

  it("G: a unique-constraint race keeps a single published row", async () => {
    let row: { id: string; propertyTax: string; status: string } | null = null
    let reads = 0
    const result = await insertPublishedDemand({
      findPublished: async () => {
        reads += 1
        if (reads === 1) return null
        return row
      },
      create: async () => {
        if (row) {
          throw new Prisma.PrismaClientKnownRequestError("Unique constraint", {
            code: "P2002",
            clientVersion: "test",
          })
        }
        row = { id: "demand-1", propertyTax: "1500.00", status: "PUBLISHED" }
        throw new Prisma.PrismaClientKnownRequestError("Unique constraint", {
          code: "P2002",
          clientVersion: "test",
        })
      },
    })
    expect(isUniqueConstraint(result)).toBe(false)
    expect(result.created).toBe(false)
    expect(result.row.id).toBe("demand-1")
    expect(row).toEqual(result.row)
  })
})

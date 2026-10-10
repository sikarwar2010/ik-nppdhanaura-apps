import { PERMISSIONS } from "@workspace/types"
import type { PrismaClient } from "@prisma/client"

import { isGrantedToDepartmentAdmin, seedDatabase } from "./seed-database"

function createPrismaMock() {
  const users = new Map<
    string,
    {
      id: string
      email: string
      name: string
      passwordHash?: string
    }
  >()
  const userRoles: Array<{ userId: string; roleId: string }> = []
  const permissions = [
    { id: "perm-1", code: "dashboard:read" },
    { id: "perm-2", code: "user:read" },
  ]
  const roles = new Map<string, { id: string; code: string }>([
    ["SUPER_ADMIN", { id: "role-super", code: "SUPER_ADMIN" }],
    ["DEPARTMENT_ADMIN", { id: "role-dept", code: "DEPARTMENT_ADMIN" }],
    ["CLERK", { id: "role-clerk", code: "CLERK" }],
    ["OPERATOR", { id: "role-operator", code: "OPERATOR" }],
  ])

  const prisma = {
    ward: {
      upsert: jest.fn(async () => ({})),
    },
    referenceCategory: {
      upsert: jest.fn(async ({ where }: { where: { code: string } }) => ({
        id: `cat-${where.code}`,
      })),
    },
    referenceEntry: {
      upsert: jest.fn(async () => ({})),
    },
    permission: {
      upsert: jest.fn(async () => ({})),
      findMany: jest.fn(async () => permissions),
    },
    role: {
      upsert: jest.fn(async ({ where }: { where: { code: string } }) =>
        roles.get(where.code)
      ),
      findUniqueOrThrow: jest.fn(
        async ({ where }: { where: { code: string } }) => {
          const role = roles.get(where.code)
          if (!role) throw new Error("missing role")
          return role
        }
      ),
    },
    rolePermission: {
      upsert: jest.fn(async () => ({})),
    },
    user: {
      findUnique: jest.fn(async ({ where }: { where: { email: string } }) => {
        return users.get(where.email) ?? null
      }),
      upsert: jest.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: { email: string }
          create: { email: string; name: string; passwordHash?: string }
          update?: { passwordHash?: string; name?: string }
        }) => {
          const existing = users.get(where.email)
          if (existing) {
            if (update?.passwordHash) existing.passwordHash = update.passwordHash
            if (update?.name) existing.name = update.name
            return existing
          }
          const created = { id: `user-${users.size + 1}`, ...create }
          users.set(create.email, created)
          return created
        }
      ),
    },
    userRole: {
      upsert: jest.fn(
        async ({ create }: { create: { userId: string; roleId: string } }) => {
          userRoles.push(create)
          return create
        }
      ),
    },
  }

  return {
    prisma: prisma as unknown as PrismaClient,
    users,
    userRoles,
  }
}

const seedEnv = {
  NODE_ENV: "test",
  SEED_ADMIN_EMAIL: "admin@example.com",
  SEED_ADMIN_NAME: "Super Admin",
  SEED_ADMIN_PASSWORD: "strong-pass-1",
}

describe("isGrantedToDepartmentAdmin", () => {
  it("does not grant survey:bulk-delete or user/role write", () => {
    expect(isGrantedToDepartmentAdmin("survey:delete")).toBe(true)
    expect(isGrantedToDepartmentAdmin("survey:bulk-delete")).toBe(false)
    expect(isGrantedToDepartmentAdmin("user:create")).toBe(false)
    expect(isGrantedToDepartmentAdmin("role:update")).toBe(false)
    expect(PERMISSIONS).toContain("survey:bulk-delete")
  })
})

describe("seedDatabase", () => {
  it("seeds configured municipality ward data", async () => {
    const { prisma } = createPrismaMock()
    const wards = [
      { number: 1, code: "W01", name: "Ward 01 - Sample Locality" },
      { number: 2, code: "W02", name: "Ward 02 - Market Area" },
    ]

    await seedDatabase(prisma, {
      env: {
        ...seedEnv,
        MUNICIPALITY_WARDS_JSON: JSON.stringify(wards),
      },
      hashPassword: async () => "hashed",
      logger: { info: () => undefined },
    })

    expect(prisma.ward.upsert).toHaveBeenCalledTimes(2)
    expect(prisma.ward.upsert).toHaveBeenCalledWith({
      where: { number: 1 },
      update: { code: "W01", name: "Ward 01 - Sample Locality", isActive: true },
      create: { ...wards[0], isActive: true },
    })
  })

  it("rejects invalid configured ward data", async () => {
    const { prisma } = createPrismaMock()

    await expect(
      seedDatabase(prisma, {
        env: {
          ...seedEnv,
          MUNICIPALITY_WARDS_JSON: '[{"number":0,"code":"W01","name":"Ward 1"}]',
        },
        hashPassword: async () => "hashed",
        logger: { info: () => undefined },
      })
    ).rejects.toThrow("MUNICIPALITY_WARDS_JSON entry 1")
    expect(prisma.ward.upsert).not.toHaveBeenCalled()
  })

  it("creates a Super Admin with passwordHash on user", async () => {
    const { prisma, users, userRoles } = createPrismaMock()
    const logs: string[] = []

    await seedDatabase(prisma, {
      env: seedEnv,
      hashPassword: async (password) => `hashed:${password}`,
      logger: { info: (m) => logs.push(m) },
    })

    expect(users.size).toBe(1)
    const admin = users.get("admin@example.com")
    expect(admin?.email).toBe("admin@example.com")
    expect(admin?.passwordHash).toBe("hashed:strong-pass-1")
    expect(userRoles).toEqual([{ userId: "user-1", roleId: "role-super" }])
    expect(logs.some((l) => l.includes("Seeding Super Admin"))).toBe(true)
    expect(logs.join("\n")).not.toMatch(/strong-pass-1/)
    expect(logs.join("\n")).not.toMatch(/hashed:/)
  })

  it("is idempotent and does not create a second Super Admin", async () => {
    const { prisma, users } = createPrismaMock()

    await seedDatabase(prisma, {
      env: seedEnv,
      hashPassword: async (password) => `hashed:${password}`,
      logger: { info: () => undefined },
    })
    await seedDatabase(prisma, {
      env: seedEnv,
      hashPassword: async (password) => `hashed:${password}-2`,
      logger: { info: () => undefined },
    })

    expect(users.size).toBe(1)
    expect(users.get("admin@example.com")?.passwordHash).toBe(
      "hashed:strong-pass-1-2"
    )
  })
})

import { ForbiddenException } from "@nestjs/common"
import { Reflector } from "@nestjs/core"

import { REQUIRE_PERMISSIONS_KEY } from "./auth.decorators"
import { PermissionGuard } from "./permission.guard"

function contextWithUser(user?: { roles: string[]; permissions: string[] }) {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as never
}

describe("PermissionGuard", () => {
  it("allows Super Admin to clear a ward without an explicit grant", () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(["survey:bulk-delete"]),
    }
    const guard = new PermissionGuard(reflector as unknown as Reflector)
    expect(
      guard.canActivate(
        contextWithUser({
          roles: ["SUPER_ADMIN"],
          permissions: [],
        })
      )
    ).toBe(true)
  })

  it("allows Super Admin without matching permission codes", () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(["user:delete"]),
    }
    const guard = new PermissionGuard(reflector as unknown as Reflector)
    expect(
      guard.canActivate(
        contextWithUser({
          roles: ["SUPER_ADMIN"],
          permissions: [],
        })
      )
    ).toBe(true)
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      REQUIRE_PERMISSIONS_KEY,
      expect.any(Array)
    )
  })

  it("rejects a user missing the required permission", () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(["user:delete"]),
    }
    const guard = new PermissionGuard(reflector as unknown as Reflector)
    expect(() =>
      guard.canActivate(
        contextWithUser({
          roles: ["OPERATOR"],
          permissions: ["survey:read"],
        })
      )
    ).toThrow(ForbiddenException)
  })

  it("rejects Department Admin without survey:bulk-delete", () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(["survey:bulk-delete"]),
    }
    const guard = new PermissionGuard(reflector as unknown as Reflector)
    expect(() =>
      guard.canActivate(
        contextWithUser({
          roles: ["DEPARTMENT_ADMIN"],
          permissions: ["survey:read", "survey:delete"],
        })
      )
    ).toThrow(ForbiddenException)
  })

  it("rejects Clerk and Operator for survey:bulk-delete", () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(["survey:bulk-delete"]),
    }
    const guard = new PermissionGuard(reflector as unknown as Reflector)
    for (const roles of [["CLERK"], ["OPERATOR"]] as const) {
      expect(() =>
        guard.canActivate(
          contextWithUser({
            roles: [...roles],
            permissions: ["survey:read", "import:create"],
          })
        )
      ).toThrow(ForbiddenException)
    }
  })
})

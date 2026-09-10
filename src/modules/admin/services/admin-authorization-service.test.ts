import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  AppUser,
} from "@/modules/users/domain/user";

import {
  AdminAuthorizationService,
} from "./admin-authorization-service";

vi.mock("next/navigation", () => ({
  redirect(
    path: string,
  ): never {
    throw new Error(
      `REDIRECT:${path}`,
    );
  },
}));

function createUser(
  role: AppUser["role"],
): AppUser {
  return {
    id: "user-1",
    authUserId: "auth-1",
    displayName: "Ada",
    role,
    createdAt: new Date(
      "2026-01-01T00:00:00.000Z",
    ),
  };
}

describe("AdminAuthorizationService", () => {
  it("allows an admin user", async () => {
    const admin =
      createUser("admin");

    const service =
      new AdminAuthorizationService({
        async syncCurrentUser() {
          return admin;
        },
      });

    await expect(
      service.requireAdmin(),
    ).resolves.toEqual(admin);

    await expect(
      service.getAdminUser(),
    ).resolves.toEqual(admin);
  });

  it("denies a normal authenticated user", async () => {
    const service =
      new AdminAuthorizationService({
        async syncCurrentUser() {
          return createUser(
            "user",
          );
        },
      });

    await expect(
      service.requireAdmin(),
    ).rejects.toThrow(
      "REDIRECT:/dashboard",
    );

    await expect(
      service.getAdminUser(),
    ).resolves.toBeNull();
  });

  it("denies an anonymous user", async () => {
    const service =
      new AdminAuthorizationService({
        async syncCurrentUser() {
          return null;
        },
      });

    await expect(
      service.requireAdmin(),
    ).rejects.toThrow(
      "REDIRECT:/login",
    );

    await expect(
      service.getAdminUser(),
    ).resolves.toBeNull();
  });
});

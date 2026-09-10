import {
  redirect,
} from "next/navigation";

import type {
  AppUser,
} from "@/modules/users/domain/user";

import {
  isAdminUser,
} from "@/modules/users/domain/user";

export type CurrentUserProvider = {
  syncCurrentUser(): Promise<
    AppUser | null
  >;
};

export class AdminAuthorizationService {
  constructor(
    private readonly currentUser:
      CurrentUserProvider,
  ) {}

  async getAdminUser():
    Promise<AppUser | null> {
    const user =
      await this.currentUser
        .syncCurrentUser();

    if (
      !user ||
      !isAdminUser(user)
    ) {
      return null;
    }

    return user;
  }

  async requireAdmin():
    Promise<AppUser> {
    const user =
      await this.currentUser
        .syncCurrentUser();

    if (!user) {
      redirect("/login");
    }

    if (!isAdminUser(user)) {
      redirect(
        "/dashboard",
      );
    }

    return user;
  }
}

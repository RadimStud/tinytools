import type {
  User,
} from "@supabase/supabase-js";

import {
  createSupabaseServerClient,
} from "@/infrastructure/supabase/server-client";

import type {
  AppUser,
} from "@/modules/users/domain/user";

import type {
  UserRepository,
} from "@/modules/users/repositories/user-repository";

export class AuthService {
  constructor(
    private readonly userRepository:
      UserRepository,
  ) {}

  async getAuthenticatedUser():
    Promise<User | null> {
    const supabase =
      await createSupabaseServerClient();

    const {
      data: claimsData,
      error: claimsError,
    } =
      await supabase.auth.getClaims();

    if (
      claimsError ||
      !claimsData?.claims?.sub
    ) {
      return null;
    }

    const {
      data,
      error,
    } =
      await supabase.auth.getUser();

    if (
      error ||
      !data.user
    ) {
      return null;
    }

    return data.user;
  }

  async syncCurrentUser():
    Promise<AppUser | null> {
    const authUser =
      await this.getAuthenticatedUser();

    if (!authUser) {
      return null;
    }

    const metadataName =
      typeof authUser.user_metadata
        ?.display_name === "string"
        ? authUser.user_metadata
            .display_name
            .trim()
        : "";

    const fallbackName =
      authUser.email
        ?.split("@")[0]
        ?.trim() ||
      "MiniKit user";

    return this.userRepository
      .findOrCreate({
        authUserId:
          authUser.id,

        displayName:
          metadataName ||
          fallbackName,
      });
  }
}
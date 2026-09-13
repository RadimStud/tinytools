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

  async getAuthenticatedUser(): Promise<User | null> {
    return (await this.getAuthenticatedSession())?.user ?? null;
  }

  async getAuthenticatedSession(): Promise<{ user: User; sessionId: string | null } | null> {
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

    if (data.user.id !== claimsData.claims.sub) return null;
    const sessionId = typeof claimsData.claims.session_id === "string" ? claimsData.claims.session_id : null;
    if (process.env.MINIKIT_PLATFORM_ENABLED === "1") {
      if (!sessionId || !/^[0-9a-f-]{36}$/i.test(sessionId)) return null;
      const [{ sql }, { isLiveSession }] = await Promise.all([
        import("@/infrastructure/db/client"), import("./live-session"),
      ]);
      if (!await isLiveSession(sql, data.user.id, sessionId)) return null;
    }
    return { user: data.user, sessionId };
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
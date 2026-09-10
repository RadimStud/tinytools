import type {
  AppUser,
} from "../domain/user";

import type {
  CreateUserInput,
  UserRepository,
} from "./user-repository";

function cloneUser(
  user: AppUser,
): AppUser {
  return {
    ...user,
  };
}

export class InMemoryUserRepository
  implements UserRepository
{
  constructor(
    private readonly users: AppUser[] = [],
  ) {}

  async findByAuthUserId(
    authUserId: string,
  ): Promise<AppUser | null> {
    const user =
      this.users.find(
        (item) =>
          item.authUserId ===
          authUserId,
      );

    return user
      ? cloneUser(user)
      : null;
  }

  async findOrCreate(
    input: CreateUserInput,
  ): Promise<AppUser> {
    const existing =
      await this.findByAuthUserId(
        input.authUserId,
      );

    if (existing) {
      return existing;
    }

    const created: AppUser = {
      id: crypto.randomUUID(),
      authUserId:
        input.authUserId,
      displayName:
        input.displayName,
      role: "user",
      createdAt: new Date(),
    };

    this.users.push(created);

    return cloneUser(created);
  }
}

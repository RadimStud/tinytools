import type {
  AppUser,
} from "../domain/user";

export type CreateUserInput = {
  authUserId: string;
  displayName: string;
};

export interface UserRepository {
  findByAuthUserId(
    authUserId: string,
  ): Promise<AppUser | null>;

  findOrCreate(
    input: CreateUserInput,
  ): Promise<AppUser>;
}
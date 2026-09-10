import type {
  AdminRepository,
} from "../repositories/admin-repository";

import type {
  AdminAuthorizationService,
} from "./admin-authorization-service";

export class AdminService {
  constructor(
    private readonly authorization:
      AdminAuthorizationService,

    private readonly repository:
      AdminRepository,
  ) {}

  async getStats() {
    await this.authorization
      .requireAdmin();

    return this.repository
      .getStats();
  }

  async listUsers() {
    await this.authorization
      .requireAdmin();

    return this.repository
      .listUsers();
  }

  async listTools() {
    await this.authorization
      .requireAdmin();

    return this.repository
      .listTools();
  }
}

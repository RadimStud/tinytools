import { z } from "zod";
import { appView, PlatformError, type PlatformIdentity } from "../domain/platform";
import type { PlatformRepository } from "../repositories/platform-repository";

export type PlatformUserProvider = { syncCurrentUser(): Promise<PlatformIdentity | null> };
const changeSchema = z.object({
  subject: z.string().uuid(), app_id: z.string().regex(/^[a-z][a-z0-9-]{0,47}$/),
  status: z.enum(["enabled", "suspended", "revoked"]), app_role: z.enum(["user", "app_admin"]),
  expected_policy_version: z.number().int().min(0).max(2147483646),
  reason: z.string().trim().min(5).max(500),
}).strict();

export class PlatformService {
  constructor(
    private readonly currentUser: PlatformUserProvider,
    private readonly repository: PlatformRepository,
    private readonly enabled: () => boolean,
  ) {}
  private async identity(): Promise<PlatformIdentity> {
    const user = await this.currentUser.syncCurrentUser();
    if (!user) throw new PlatformError(401, "unauthenticated");
    if (!this.enabled()) throw new PlatformError(503, "platform_disabled");
    return { authUserId: user.authUserId, displayName: user.displayName };
  }
  async me() {
    const user = await this.identity();
    return {
      subject: user.authUserId, display_name: user.displayName,
      platform_permissions: await this.repository.isPlatformAdmin(user.authUserId) ? ["platform.admin"] : [],
    };
  }
  async apps() {
    const user = await this.identity();
    const [apps, grants] = await Promise.all([
      this.repository.listApps(), this.repository.listAccess(user.authUserId),
    ]);
    return apps.map(app => appView(app, grants.find(grant => grant.app_id === app.app_id) ?? null));
  }
  async access(appId: string) {
    const apps = await this.apps();
    const app = apps.find(candidate => candidate.app_id === appId);
    if (!app) throw new PlatformError(404, "app_not_found");
    return app;
  }
  private async admin() {
    const user = await this.identity();
    if (!await this.repository.isPlatformAdmin(user.authUserId)) throw new PlatformError(403, "access_denied");
    return user;
  }
  async adminOverview(subject?: string) {
    await this.admin();
    if (subject && !z.string().uuid().safeParse(subject).success) throw new PlatformError(400, "invalid_request");
    const [apps, users, audit, grants] = await Promise.all([
      this.repository.listApps(), this.repository.listUsers(), this.repository.recentAudit(),
      subject ? this.repository.listAccess(subject) : Promise.resolve([]),
    ]);
    return { apps, users, audit, grants };
  }
  async changeAccess(input: unknown, requestId: string) {
    const user = await this.admin();
    const parsed = changeSchema.safeParse(input);
    if (!parsed.success) throw new PlatformError(400, "invalid_request");
    return this.repository.changeAccess(user.authUserId, parsed.data, requestId);
  }
}

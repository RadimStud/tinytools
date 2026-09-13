import type { AccessChange, AppAccess, AuditEvent, PlatformApp } from "../domain/platform";

export interface PlatformRepository {
  isPlatformAdmin(subject: string): Promise<boolean>;
  listApps(): Promise<PlatformApp[]>;
  listAccess(subject: string): Promise<AppAccess[]>;
  listUsers(): Promise<{ auth_user_id: string; display_name: string }[]>;
  recentAudit(): Promise<AuditEvent[]>;
  // The implementation must recheck the actor and atomically update access + audit.
  changeAccess(actor: string, change: AccessChange, requestId: string): Promise<AppAccess>;
}

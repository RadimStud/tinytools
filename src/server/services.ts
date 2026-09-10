import { AdminAuthorizationService } from "@/modules/admin/services/admin-authorization-service";
import { AdminService } from "@/modules/admin/services/admin-service";
import { PostgresAdminRepository } from "@/modules/admin/repositories/postgres-admin-repository";

import { AuthService } from "@/modules/auth/services/auth-service";

import { PostgresToolRequestRepository } from "@/modules/requests/repositories/postgres-tool-request-repository";
import { ToolRequestService } from "@/modules/requests/services/tool-request-service";

import { PostgresDeveloperToolRepository } from "@/modules/tools/repositories/postgres-developer-tool-repository";
import { PostgresToolPublishingRepository } from "@/modules/tools/repositories/postgres-tool-publishing-repository";
import { PostgresToolRepository } from "@/modules/tools/repositories/postgres-tool-repository";

import { DeveloperToolService } from "@/modules/tools/services/developer-tool-service";
import { ToolPublishingService } from "@/modules/tools/services/tool-publishing-service";
import { ToolService } from "@/modules/tools/services/tool-service";

import { PostgresUserRepository } from "@/modules/users/repositories/postgres-user-repository";
import { PostgresVaultRepository } from "@/modules/superuser/repositories/postgres-vault-repository";
import { VaultService } from "@/modules/superuser/services/vault-service";
import { createUploadUrl, createDownloadUrl, headFile, deleteFile } from "@/infrastructure/storage/r2-storage";

const userRepository =
  new PostgresUserRepository();

const toolRepository =
  new PostgresToolRepository();

const toolRequestRepository =
  new PostgresToolRequestRepository();

const toolPublishingRepository =
  new PostgresToolPublishingRepository();

const developerToolRepository =
  new PostgresDeveloperToolRepository();

const adminRepository =
  new PostgresAdminRepository();

const authService =
  new AuthService(
    userRepository,
  );

const adminAuthorization =
  new AdminAuthorizationService(
    authService,
  );

export const services = {
  vault: new VaultService(authService, new PostgresVaultRepository(), {
    uploadUrl: key => createUploadUrl(key, "application/octet-stream", 300),
    downloadUrl: (key, name) => createDownloadUrl(key, { fileName: name, contentType: "application/octet-stream", expiresIn: 60 }),
    size: async key => (await headFile(key)).fileSizeBytes,
    remove: deleteFile,
  }),
  auth:
    authService,

  tools:
    new ToolService(
      toolRepository,
    ),

  requests:
    new ToolRequestService(
      toolRequestRepository,
    ),

  publishing:
    new ToolPublishingService(
      toolPublishingRepository,
    ),

  developerTools:
    new DeveloperToolService(
      developerToolRepository,
    ),

  adminAuth:
    adminAuthorization,

  admin:
    new AdminService(
      adminAuthorization,
      adminRepository,
    ),
};

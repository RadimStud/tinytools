"use server";

import {
  createDownloadUrl,
  createToolFileKey,
  createUploadUrl,
  headFile,
} from "@/infrastructure/storage/r2-storage";

import {
  revalidatePath,
} from "next/cache";

import {
  redirect,
} from "next/navigation";

import type {
  ToolPlatform,
} from "@/modules/tools/domain/tool";

import {
  getToolErrorMessage,
} from "@/modules/tools/domain/tool-error";

import {
  fallbackFileNameFromKey,
} from "@/modules/tools/domain/version-rules";

import {
  services,
} from "@/server/services";

const supportedPlatforms:
  ToolPlatform[] = [
    "windows",
    "macos",
    "linux",
  ];

function errorUrl(
  toolId: string,
  message: string,
) {
  return (
    `/dashboard/tools/${toolId}` +
    `?error=${encodeURIComponent(message)}`
  );
}

async function requireUser() {
  const appUser =
    await services.auth
      .syncCurrentUser();

  if (!appUser) {
    redirect(
      "/login",
    );
  }

  return appUser;
}

async function requireOwnedVersion(
  toolId: string,
  versionId: string,
  ownerId: string,
) {
  const tool =
    await services.developerTools
      .getToolForOwner(
        toolId,
        ownerId,
      );

  if (!tool) {
    throw new Error(
      "Tool not found.",
    );
  }

  const version =
    tool.versions.find(
      (item) =>
        item.id === versionId,
    );

  if (!version) {
    throw new Error(
      "Version not found.",
    );
  }

  return {
    tool,
    version,
  };
}

function revalidateMarketplace(
  slug?: string,
) {
  revalidatePath("/");
  revalidatePath("/search");

  if (slug) {
    revalidatePath(
      `/tools/${slug}`,
    );
    revalidatePath(
      `/tools/${slug}/download`,
    );
  }
}

export async function updateTool(
  toolId: string,
  formData: FormData,
) {
  const appUser =
    await requireUser();

  const platforms =
    supportedPlatforms.filter(
      (platform) =>
        formData.get(
          `platform-${platform}`,
        ) === "on",
    );

  try {
    await services.developerTools
      .updateTool({
        toolId,

        ownerId:
          appUser.id,

        name:
          String(
            formData.get(
              "name",
            ) ?? "",
          ),

        shortDescription:
          String(
            formData.get(
              "shortDescription",
            ) ?? "",
          ),

        description:
          String(
            formData.get(
              "description",
            ) ?? "",
          ),

        priceEuros:
          Number(
            formData.get(
              "priceEuros",
            ) ?? 0,
          ),

        platforms,
      });
  } catch (error) {
    redirect(
      errorUrl(
        toolId,
        getToolErrorMessage(
          error,
          "Could not update tool.",
        ),
      ),
    );
  }

  revalidatePath(
    "/dashboard",
  );

  revalidatePath(
    `/dashboard/tools/${toolId}`,
  );

  redirect(
    `/dashboard/tools/${toolId}?saved=1`,
  );
}

export async function createVersion(
  toolId: string,
  formData: FormData,
) {
  const appUser =
    await requireUser();

  try {
    await services.developerTools
      .createVersion({
        toolId,

        ownerId:
          appUser.id,

        version:
          String(
            formData.get(
              "version",
            ) ?? "",
          ),
      });
  } catch (error) {
    redirect(
      errorUrl(
        toolId,
        getToolErrorMessage(
          error,
          "Could not create version.",
        ),
      ),
    );
  }

  revalidatePath(
    `/dashboard/tools/${toolId}`,
  );

  redirect(
    `/dashboard/tools/${toolId}?versionCreated=1`,
  );
}

export async function prepareVersionUpload(
  toolId: string,
  versionId: string,
  fileName: string,
  contentType: string,
) {
  const appUser =
    await requireUser();

  try {
    const {
      version,
    } =
      await requireOwnedVersion(
        toolId,
        versionId,
        appUser.id,
      );

    if (version.fileKey) {
      throw new Error(
        "This version already has a binary.",
      );
    }

    const normalizedFileName =
      fileName.trim();

    if (!normalizedFileName) {
      throw new Error(
        "Select a file.",
      );
    }

    if (
      normalizedFileName.length >
      180
    ) {
      throw new Error(
        "File name is too long.",
      );
    }

    const normalizedContentType =
      contentType.trim() ||
      "application/octet-stream";

    const fileKey =
      createToolFileKey(
        toolId,
        version.version,
        normalizedFileName,
      );

    const uploadUrl =
      await createUploadUrl(
        fileKey,
        normalizedContentType,
      );

    return {
      ok: true as const,
      uploadUrl,
    };
  } catch (error) {
    return {
      ok: false as const,
      error:
        getToolErrorMessage(
          error,
          "Could not prepare upload.",
        ),
    };
  }
}

export async function finalizeVersionUpload(
  toolId: string,
  versionId: string,
  fileName: string,
  checksum: string,
  contentType: string,
  fileSizeBytes: number,
) {
  const appUser =
    await requireUser();

  try {
    const {
      version,
    } =
      await requireOwnedVersion(
        toolId,
        versionId,
        appUser.id,
      );

    const fileKey =
      createToolFileKey(
        toolId,
        version.version,
        fileName,
      );

    let storedContentType =
      contentType.trim() ||
      "application/octet-stream";

    let storedFileSize =
      Number.isFinite(
        fileSizeBytes,
      ) &&
      fileSizeBytes >= 0
        ? Math.round(
            fileSizeBytes,
          )
        : null;

    try {
      const head =
        await headFile(
          fileKey,
        );

      if (head.contentType) {
        storedContentType =
          head.contentType;
      }

      if (
        typeof head.fileSizeBytes ===
        "number"
      ) {
        storedFileSize =
          head.fileSizeBytes;
      }
    } catch {
      // Keep client-provided metadata when HeadObject is unavailable.
    }

    await services.developerTools
      .attachVersionFile({
        toolId,

        ownerId:
          appUser.id,

        versionId,

        fileKey,

        checksum,

        originalFileName:
          fileName.trim(),

        contentType:
          storedContentType,

        fileSizeBytes:
          storedFileSize,
      });

    revalidatePath(
      `/dashboard/tools/${toolId}`,
    );

    return {
      ok: true as const,
    };
  } catch (error) {
    return {
      ok: false as const,
      error:
        getToolErrorMessage(
          error,
          "Could not attach binary.",
        ),
    };
  }
}

export async function getVersionDownloadUrl(
  toolId: string,
  versionId: string,
) {
  const appUser =
    await requireUser();

  try {
    const {
      version,
    } =
      await requireOwnedVersion(
        toolId,
        versionId,
        appUser.id,
      );

    if (!version.fileKey) {
      throw new Error(
        "This version has no binary.",
      );
    }

    const url =
      await createDownloadUrl(
        version.fileKey,
        {
          fileName:
            version.originalFileName ??
            fallbackFileNameFromKey(
              version.fileKey,
            ),

          contentType:
            version.contentType,
        },
      );

    return {
      ok: true as const,
      url,
    };
  } catch (error) {
    return {
      ok: false as const,
      error:
        getToolErrorMessage(
          error,
          "Download failed.",
        ),
    };
  }
}

export async function publishTool(
  toolId: string,
  formData: FormData,
) {
  const appUser =
    await requireUser();

  const versionId =
    String(
      formData.get(
        "versionId",
      ) ?? "",
    ).trim();

  let slug = "";

  try {
    const result =
      await services.developerTools
        .publishTool(
          toolId,
          appUser.id,
          versionId ||
            undefined,
        );

    slug =
      result.slug;
  } catch (error) {
    redirect(
      errorUrl(
        toolId,
        getToolErrorMessage(
          error,
          "Could not publish tool.",
        ),
      ),
    );
  }

  revalidatePath(
    "/dashboard",
  );

  revalidatePath(
    `/dashboard/tools/${toolId}`,
  );

  revalidateMarketplace(
    slug,
  );

  redirect(
    `/dashboard/tools/${toolId}?published=1`,
  );
}

export async function setCurrentRelease(
  toolId: string,
  formData: FormData,
) {
  const appUser =
    await requireUser();

  const versionId =
    String(
      formData.get(
        "versionId",
      ) ?? "",
    ).trim();

  let slug = "";

  try {
    const result =
      await services.developerTools
        .setCurrentRelease(
          toolId,
          appUser.id,
          versionId,
        );

    slug =
      result.slug;
  } catch (error) {
    redirect(
      errorUrl(
        toolId,
        getToolErrorMessage(
          error,
          "Could not set current release.",
        ),
      ),
    );
  }

  revalidatePath(
    "/dashboard",
  );

  revalidatePath(
    `/dashboard/tools/${toolId}`,
  );

  revalidateMarketplace(
    slug,
  );

  redirect(
    `/dashboard/tools/${toolId}?releaseUpdated=1`,
  );
}

export async function archiveTool(
  toolId: string,
) {
  const appUser =
    await requireUser();

  let slug = "";

  try {
    const result =
      await services.developerTools
        .archiveTool(
          toolId,
          appUser.id,
        );

    slug =
      result.slug;
  } catch (error) {
    redirect(
      errorUrl(
        toolId,
        getToolErrorMessage(
          error,
          "Could not archive tool.",
        ),
      ),
    );
  }

  revalidatePath(
    "/dashboard",
  );

  revalidatePath(
    `/dashboard/tools/${toolId}`,
  );

  revalidateMarketplace(
    slug,
  );

  redirect(
    `/dashboard/tools/${toolId}?archived=1`,
  );
}

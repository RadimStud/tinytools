"use server";
import {
  createDownloadUrl,
  createToolFileKey,
  createUploadUrl,
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

  return version;
}

function getErrorMessage(
  error: unknown,
) {
  return error instanceof Error
    ? error.message
    : "Unexpected error.";
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
    const message =
      error instanceof Error
        ? error.message
        : "Could not update tool.";

    redirect(
      errorUrl(
        toolId,
        message,
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
    const message =
      error instanceof Error
        ? error.message
        : "Could not create version.";

    redirect(
      errorUrl(
        toolId,
        message,
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
    const version =
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
  }
  catch (error) {
    return {
      ok: false as const,
      error:
        getErrorMessage(error),
    };
  }
}

export async function finalizeVersionUpload(
  toolId: string,
  versionId: string,
  fileName: string,
  checksum: string,
) {
  const appUser =
    await requireUser();

  try {
    const version =
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

    await services.developerTools
      .attachVersionFile({
        toolId,

        ownerId:
          appUser.id,

        versionId,

        fileKey,

        checksum,
      });

    revalidatePath(
      `/dashboard/tools/${toolId}`,
    );

    return {
      ok: true as const,
    };
  }
  catch (error) {
    return {
      ok: false as const,
      error:
        getErrorMessage(error),
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
    const version =
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
      );

    return {
      ok: true as const,
      url,
    };
  }
  catch (error) {
    return {
      ok: false as const,
      error:
        getErrorMessage(error),
    };
  }
}
export async function publishTool(
  toolId: string,
) {
  const appUser =
    await requireUser();

  let slug = "";

  try {
    const result =
      await services.developerTools
        .publishTool(
          toolId,
          appUser.id,
        );

    slug =
      result.slug;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not publish tool.";

    redirect(
      errorUrl(
        toolId,
        message,
      ),
    );
  }

  revalidatePath(
    "/",
  );

  revalidatePath(
    "/search",
  );

  revalidatePath(
    "/dashboard",
  );

  revalidatePath(
    `/dashboard/tools/${toolId}`,
  );

  if (slug) {
    revalidatePath(
      `/tools/${slug}`,
    );
  }

  redirect(
    `/dashboard/tools/${toolId}?published=1`,
  );
}

export async function archiveTool(
  toolId: string,
) {
  const appUser =
    await requireUser();

  try {
    await services.developerTools
      .archiveTool(
        toolId,
        appUser.id,
      );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not archive tool.";

    redirect(
      errorUrl(
        toolId,
        message,
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
    `/dashboard/tools/${toolId}?archived=1`,
  );
}
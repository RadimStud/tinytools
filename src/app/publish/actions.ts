"use server";

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

function fail(
  message: string,
): never {
  redirect(
    `/publish?error=${encodeURIComponent(message)}`,
  );
}

export async function publishToolDraft(
  formData: FormData,
) {
  const appUser =
    await services.auth
      .syncCurrentUser();

  if (!appUser) {
    redirect(
      "/login",
    );
  }

  const name =
    String(
      formData.get("name") ??
        "",
    ).trim();

  const shortDescription =
    String(
      formData.get(
        "shortDescription",
      ) ?? "",
    ).trim();

  const rawPrice =
    Number(
      formData.get(
        "priceEuros",
      ) ?? 0,
    );

  const platforms =
    supportedPlatforms.filter(
      (platform) =>
        formData.get(
          `platform-${platform}`,
        ) === "on",
    );

  if (
    name.length < 2
  ) {
    fail(
      "Tool name must have at least 2 characters.",
    );
  }

  if (
    shortDescription.length <
    10
  ) {
    fail(
      "Description must have at least 10 characters.",
    );
  }

  if (
    platforms.length === 0
  ) {
    fail(
      "Select at least one platform.",
    );
  }

  if (
    !Number.isFinite(
      rawPrice,
    ) ||
    rawPrice < 0
  ) {
    fail(
      "Price must be zero or greater.",
    );
  }

  try {
    await services.publishing
      .createDraft({
        ownerId:
          appUser.id,

        name,

        shortDescription,

        priceEuros:
          rawPrice,

        platforms,
      });
  }
  catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not create tool.";

    fail(
      message,
    );
  }

  redirect(
    "/dashboard?created=1",
  );
}
"use server";

import { redirect } from "next/navigation";

import type {
  ToolPlatform,
} from "@/modules/tools/domain/tool";

import { services } from "@/server/services";

const supportedPlatforms:
  ToolPlatform[] = [
    "windows",
    "macos",
    "linux",
  ];

export async function publishToolDraft(
  formData: FormData,
) {
  const name =
    String(
      formData.get("name") ??
        "",
    );

  const shortDescription =
    String(
      formData.get(
        "shortDescription",
      ) ?? "",
    );

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

  const tool =
    await services.publishing.createDraft({
      name,
      shortDescription,
      priceEuros:
        Number.isFinite(
          rawPrice,
        )
          ? rawPrice
          : 0,
      platforms,
    });

  redirect(
    `/publish/success?slug=${encodeURIComponent(tool.slug)}`,
  );
}
"use server";

import { redirect } from "next/navigation";

import { services } from "@/server/services";

export async function createToolRequest(
  formData: FormData,
) {
  const description =
    String(
      formData.get(
        "description",
      ) ?? "",
    );

  try {
    await services.requests.createRequest(
      description,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not submit request.";

    redirect(
      `/request?error=${encodeURIComponent(message)}`,
    );
  }

  redirect(
    "/request/success",
  );
}
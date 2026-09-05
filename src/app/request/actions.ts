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

  await services.requests.createRequest(
    description,
  );

  redirect(
    "/request/success",
  );
}
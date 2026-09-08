import {
  NextResponse,
} from "next/server";

import {
  createDownloadUrl,
} from "@/infrastructure/storage/r2-storage";

import {
  ToolError,
} from "@/modules/tools/domain/tool-error";

import {
  fallbackFileNameFromKey,
} from "@/modules/tools/domain/version-rules";

import {
  services,
} from "@/server/services";

type DownloadRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(
  request: Request,
  {
    params,
  }: DownloadRouteProps,
) {
  void request;

  const {
    slug,
  } = await params;

  try {
    const download =
      await services.tools
        .getPublicDownload(
          slug,
        );

    const downloadUrl =
      await createDownloadUrl(
        download.fileKey,
        {
          fileName:
            download.originalFileName ??
            fallbackFileNameFromKey(
              download.fileKey,
            ),

          contentType:
            download.contentType,
        },
      );

    return NextResponse.redirect(
      downloadUrl,
      307,
    );
  } catch (error) {
    if (
      error instanceof
        ToolError &&
      error.message ===
        "Paid downloads are not available yet."
    ) {
      return new NextResponse(
        error.message,
        {
          status: 403,
        },
      );
    }

    return new NextResponse(
      error instanceof ToolError
        ? error.message
        : "Download is not available.",
      {
        status: 404,
      },
    );
  }
}

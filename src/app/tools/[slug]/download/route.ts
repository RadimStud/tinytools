import {
  and,
  desc,
  eq,
  isNotNull,
} from "drizzle-orm";

import {
  NextResponse,
} from "next/server";

import {
  db,
} from "@/infrastructure/db/db";

import {
  tools,
  toolVersions,
} from "@/infrastructure/db/schema";

import {
  createDownloadUrl,
} from "@/infrastructure/storage/r2-storage";

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

  const rows =
    await db
      .select({
        fileKey:
          toolVersions.fileKey,
      })
      .from(tools)
      .innerJoin(
        toolVersions,
        eq(
          toolVersions.toolId,
          tools.id,
        ),
      )
      .where(
        and(
          eq(
            tools.slug,
            slug,
          ),
          eq(
            tools.status,
            "published",
          ),
          eq(
            tools.priceCents,
            0,
          ),
          eq(
            toolVersions.isActive,
            true,
          ),
          isNotNull(
            toolVersions.fileKey,
          ),
        ),
      )
      .orderBy(
        desc(
          toolVersions.createdAt,
        ),
      )
      .limit(1);

  const fileKey =
    rows[0]?.fileKey;

  if (!fileKey) {
    return new NextResponse(
      "Download is not available.",
      {
        status: 404,
      },
    );
  }

  const downloadUrl =
    await createDownloadUrl(
      fileKey,
    );

  return NextResponse.redirect(
    downloadUrl,
    307,
  );
}
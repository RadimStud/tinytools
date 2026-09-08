import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import {
  getSignedUrl,
} from "@aws-sdk/s3-request-presigner";

import {
  fallbackFileNameFromKey,
  sanitizeDownloadFileName,
} from "@/modules/tools/domain/version-rules";

const DEFAULT_EXPIRATION_SECONDS = 15 * 60;

function requireR2Config() {
  const endpoint =
    process.env.R2_ENDPOINT;

  const accessKeyId =
    process.env.R2_ACCESS_KEY_ID;

  const secretAccessKey =
    process.env.R2_SECRET_ACCESS_KEY;

  const bucket =
    process.env.R2_BUCKET_NAME;

  if (
    !endpoint ||
    !accessKeyId ||
    !secretAccessKey ||
    !bucket
  ) {
    throw new Error(
      "R2 configuration is incomplete.",
    );
  }

  return {
    endpoint,
    accessKeyId,
    secretAccessKey,
    bucket,
    region:
      process.env.R2_REGION ??
      "auto",
  };
}

let cachedClient:
  | {
      client: S3Client;
      bucket: string;
    }
  | null = null;

function getR2() {
  if (cachedClient) {
    return cachedClient;
  }

  const config =
    requireR2Config();

  cachedClient = {
    bucket:
      config.bucket,

    client: new S3Client({
      region:
        config.region,
      endpoint:
        config.endpoint,
      credentials: {
        accessKeyId:
          config.accessKeyId,
        secretAccessKey:
          config.secretAccessKey,
      },
    }),
  };

  return cachedClient;
}

export function buildContentDisposition(
  fileName: string,
) {
  const safeName =
    sanitizeDownloadFileName(
      fileName,
    );

  const encoded =
    encodeURIComponent(
      safeName,
    );

  return (
    `attachment; filename="${safeName}"; ` +
    `filename*=UTF-8''${encoded}`
  );
}

export async function createUploadUrl(
  key: string,
  contentType: string,
  expiresIn = DEFAULT_EXPIRATION_SECONDS,
) {
  const {
    client,
    bucket,
  } = getR2();

  const command =
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

  return getSignedUrl(
    client,
    command,
    {
      expiresIn,
    },
  );
}

export async function createDownloadUrl(
  key: string,
  options: {
    fileName?: string | null;
    contentType?: string | null;
    expiresIn?: number;
  } = {},
) {
  const {
    client,
    bucket,
  } = getR2();

  const fileName =
    sanitizeDownloadFileName(
      options.fileName?.trim() ||
        fallbackFileNameFromKey(
          key,
        ),
    );

  const command =
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition:
        buildContentDisposition(
          fileName,
        ),
      ResponseContentType:
        options.contentType?.trim() ||
        "application/octet-stream",
    });

  return getSignedUrl(
    client,
    command,
    {
      expiresIn:
        options.expiresIn ??
        DEFAULT_EXPIRATION_SECONDS,
    },
  );
}

export async function headFile(
  key: string,
) {
  const {
    client,
    bucket,
  } = getR2();

  const result =
    await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );

  return {
    contentType:
      result.ContentType ??
      null,

    fileSizeBytes:
      typeof result.ContentLength ===
      "number"
        ? result.ContentLength
        : null,
  };
}

export async function deleteFile(
  key: string,
) {
  const {
    client,
    bucket,
  } = getR2();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}

export function createToolFileKey(
  toolId: string,
  version: string,
  fileName: string,
) {
  const safeVersion =
    version.replace(
      /[^a-zA-Z0-9._-]/g,
      "_",
    );

  const safeFileName =
    sanitizeDownloadFileName(
      fileName,
    ).replace(
      /[^a-zA-Z0-9._-]/g,
      "_",
    );

  return [
    "tools",
    toolId,
    safeVersion,
    safeFileName,
  ].join("/");
}

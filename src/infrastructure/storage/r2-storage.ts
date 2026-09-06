import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import {
  getSignedUrl,
} from "@aws-sdk/s3-request-presigner";

import {
  r2Bucket,
  r2Client,
} from "./r2-client";

const DEFAULT_EXPIRATION_SECONDS = 15 * 60;

export async function createUploadUrl(
  key: string,
  contentType: string,
  expiresIn = DEFAULT_EXPIRATION_SECONDS,
) {
  const command =
    new PutObjectCommand({
      Bucket: r2Bucket,
      Key: key,
      ContentType: contentType,
    });

  return getSignedUrl(
    r2Client,
    command,
    {
      expiresIn,
    },
  );
}

export async function createDownloadUrl(
  key: string,
  expiresIn = DEFAULT_EXPIRATION_SECONDS,
) {
  const command =
    new GetObjectCommand({
      Bucket: r2Bucket,
      Key: key,
    });

  return getSignedUrl(
    r2Client,
    command,
    {
      expiresIn,
    },
  );
}

export async function deleteFile(
  key: string,
) {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: r2Bucket,
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
    fileName.replace(
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
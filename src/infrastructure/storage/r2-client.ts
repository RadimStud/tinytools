import {
  S3Client,
} from "@aws-sdk/client-s3";

const endpoint =
  process.env.R2_ENDPOINT;

const accessKeyId =
  process.env.R2_ACCESS_KEY_ID;

const secretAccessKey =
  process.env.R2_SECRET_ACCESS_KEY;

export const r2Bucket =
  process.env.R2_BUCKET_NAME;

if (
  !endpoint ||
  !accessKeyId ||
  !secretAccessKey ||
  !r2Bucket
) {
  throw new Error(
    "R2 configuration is incomplete.",
  );
}

export const r2Client =
  new S3Client({
    region:
      process.env.R2_REGION ??
      "auto",

    endpoint,

    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
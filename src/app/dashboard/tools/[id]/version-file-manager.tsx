"use client";

import {
  useState,
} from "react";

import {
  finalizeVersionUpload,
  getVersionDownloadUrl,
  prepareVersionUpload,
} from "./actions";

type VersionFileManagerProps = {
  toolId: string;
  versionId: string;
  fileKey: string | null;
  checksum: string | null;
  originalFileName: string | null;
  disabled?: boolean;
};

async function calculateSha256(
  file: File,
) {
  const buffer =
    await file.arrayBuffer();

  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      buffer,
    );

  return Array.from(
    new Uint8Array(digest),
  )
    .map(
      (byte) =>
        byte
          .toString(16)
          .padStart(2, "0"),
    )
    .join("");
}

export function VersionFileManager({
  toolId,
  versionId,
  fileKey,
  checksum,
  originalFileName,
  disabled = false,
}: VersionFileManagerProps) {
  const [
    file,
    setFile,
  ] =
    useState<File | null>(
      null,
    );

  const [
    busy,
    setBusy,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState<string | null>(
      null,
    );

  async function upload() {
    if (!file) {
      setMessage(
        "Select a file first.",
      );

      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const contentType =
        file.type ||
        "application/octet-stream";

      const checksumValue =
        await calculateSha256(
          file,
        );

      const prepared =
        await prepareVersionUpload(
          toolId,
          versionId,
          file.name,
          contentType,
        );

      if (!prepared.ok) {
        throw new Error(
          prepared.error,
        );
      }

      const response =
        await fetch(
          prepared.uploadUrl,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                contentType,
            },

            body:
              file,
          },
        );

      if (!response.ok) {
        throw new Error(
          `R2 upload failed (${response.status}).`,
        );
      }

      const finalized =
        await finalizeVersionUpload(
          toolId,
          versionId,
          file.name,
          checksumValue,
          contentType,
          file.size,
        );

      if (!finalized.ok) {
        throw new Error(
          finalized.error,
        );
      }

      window.location.reload();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Upload failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    setBusy(true);
    setMessage(null);

    try {
      const result =
        await getVersionDownloadUrl(
          toolId,
          versionId,
        );

      if (!result.ok) {
        throw new Error(
          result.error,
        );
      }

      window.location.assign(
        result.url,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Download failed.",
      );

      setBusy(false);
    }
  }

  if (fileKey) {
    return (
      <div className="mt-3">
        <button
          type="button"
          disabled={busy}
          onClick={download}
          className="rounded-lg border border-neutral-700 px-3 py-2 text-xs hover:border-neutral-500 disabled:opacity-50"
        >
          {busy
            ? "Preparing..."
            : "Download binary"}
        </button>

        {originalFileName ? (
          <p className="mt-2 truncate text-[11px] text-neutral-600">
            {originalFileName}
          </p>
        ) : null}

        {checksum ? (
          <p className="mt-2 break-all text-[11px] text-neutral-600">
            SHA-256: {checksum}
          </p>
        ) : null}

        {message ? (
          <p className="mt-2 text-xs text-red-300">
            {message}
          </p>
        ) : null}
      </div>
    );
  }

  if (disabled) {
    return (
      <p className="mt-3 text-xs text-neutral-600">
        Binary upload is not available for this tool.
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-center gap-3">
        <input
          id={`binary-${versionId}`}
          type="file"
          disabled={busy}
          onChange={(event) => {
            setFile(
              event.target.files?.[0] ??
                null,
            );

            setMessage(null);
          }}
          className="sr-only"
        />

        <label
          htmlFor={`binary-${versionId}`}
          className="cursor-pointer rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-neutral-200 hover:border-neutral-500 hover:bg-neutral-800"
        >
          Choose file
        </label>

        <span className="min-w-0 truncate text-xs text-neutral-500">
          {file
            ? file.name
            : "No file selected"}
        </span>
      </div>

      <button
        type="button"
        disabled={
          busy ||
          !file
        }
        onClick={upload}
        className="rounded-lg border border-neutral-700 px-3 py-2 text-xs hover:border-neutral-500 disabled:opacity-50"
      >
        {busy
          ? "Uploading..."
          : "Upload binary"}
      </button>

      {message ? (
        <p className="text-xs text-red-300">
          {message}
        </p>
      ) : null}
    </div>
  );
}

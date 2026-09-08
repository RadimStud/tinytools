import Link from "next/link";
import { redirect } from "next/navigation";

import {
  services,
} from "@/server/services";

import {
  publishToolDraft,
} from "./actions";

type PublishPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function PublishPage({
  searchParams,
}: PublishPageProps) {
  const appUser =
    await services.auth
      .syncCurrentUser();

  if (!appUser) {
    redirect(
      "/login",
    );
  }

  const {
    error,
  } = await searchParams;

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-neutral-100">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm text-neutral-500 hover:text-neutral-300"
          >
            ← Dashboard
          </Link>

          <span className="text-sm text-neutral-600">
            {appUser.displayName}
          </span>
        </div>

        <h1 className="mt-8 text-4xl font-semibold">
          Publish a tool
        </h1>

        <p className="mt-3 text-neutral-400">
          Create a draft. You can upload versions and publish from the dashboard.
        </p>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <form
          action={publishToolDraft}
          className="mt-8 space-y-6"
        >
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm text-neutral-400"
            >
              Tool name
            </label>

            <input
              id="name"
              name="name"
              required
              minLength={2}
              placeholder="Image Resizer"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4 outline-none focus:border-neutral-600"
            />
          </div>

          <div>
            <label
              htmlFor="shortDescription"
              className="mb-2 block text-sm text-neutral-400"
            >
              What does it do?
            </label>

            <textarea
              id="shortDescription"
              name="shortDescription"
              required
              minLength={10}
              rows={5}
              placeholder="Resize hundreds of images locally without uploading them anywhere."
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4 outline-none focus:border-neutral-600"
            />
          </div>

          <div>
            <label
              htmlFor="priceEuros"
              className="mb-2 block text-sm text-neutral-400"
            >
              Price in EUR
            </label>

            <input
              id="priceEuros"
              name="priceEuros"
              type="number"
              min="0"
              step="0.01"
              defaultValue="0"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4 outline-none focus:border-neutral-600"
            />
          </div>

          <fieldset>
            <legend className="mb-3 text-sm text-neutral-400">
              Platforms
            </legend>

            <div className="flex flex-wrap gap-5">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="platform-windows"
                />
                Windows
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="platform-macos"
                />
                macOS
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="platform-linux"
                />
                Linux
              </label>
            </div>

            <p className="mt-2 text-xs text-neutral-600">
              Select at least one.
            </p>
          </fieldset>

          <button
            type="submit"
            className="rounded-xl bg-neutral-100 px-6 py-3 font-medium text-neutral-950"
          >
            Save draft
          </button>
        </form>
      </div>
    </main>
  );
}
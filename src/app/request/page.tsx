import Link from "next/link";

import { createToolRequest } from "./actions";

type RequestPageProps = {
  searchParams: Promise<{
    problem?: string;
  }>;
};

export default async function RequestPage({
  searchParams,
}: RequestPageProps) {
  const params =
    await searchParams;

  const problem =
    params.problem ?? "";

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-neutral-100">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-sm text-neutral-500 hover:text-neutral-300"
        >
          ← TinyTools
        </Link>

        <h1 className="mt-8 text-4xl font-semibold">
          Request a tool
        </h1>

        <p className="mt-3 text-neutral-400">
          Describe a small software problem you wish someone would solve.
        </p>

        <form
          action={createToolRequest}
          className="mt-8"
        >
          <textarea
            name="description"
            required
            minLength={10}
            maxLength={1000}
            defaultValue={problem}
            rows={8}
            placeholder="For example: I need to remove GPS and EXIF metadata from hundreds of photos at once."
            className="w-full rounded-2xl border border-neutral-800 bg-neutral-900 p-5 outline-none focus:border-neutral-600"
          />

          <button
            type="submit"
            className="mt-4 rounded-xl bg-neutral-100 px-6 py-3 font-medium text-neutral-950"
          >
            Submit request
          </button>
        </form>
      </div>
    </main>
  );
}
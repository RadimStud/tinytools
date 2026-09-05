import Link from "next/link";

export default function RequestSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-neutral-100">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-semibold">
          Request submitted.
        </h1>

        <p className="mt-4 text-neutral-400">
          The request is now stored in TinyTools.
        </p>

        <Link
          href="/"
          className="mt-8 inline-block rounded-xl bg-neutral-100 px-6 py-3 font-medium text-neutral-950"
        >
          Back to TinyTools
        </Link>
      </div>
    </main>
  );
}
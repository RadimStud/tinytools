import Link from "next/link";

type SuccessPageProps = {
  searchParams: Promise<{
    slug?: string;
  }>;
};

export default async function PublishSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const {
    slug,
  } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-neutral-100">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-semibold">
          Draft created.
        </h1>

        <p className="mt-4 text-neutral-400">
          {slug
            ? `Slug: ${slug}`
            : "Your tool was stored as a draft."}
        </p>

        <Link
          href="/"
          className="mt-8 inline-block rounded-xl bg-neutral-100 px-6 py-3 font-medium text-neutral-950"
        >
          Back to MiniKit Market
        </Link>
      </div>
    </main>
  );
}
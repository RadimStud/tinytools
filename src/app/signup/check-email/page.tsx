import Link from "next/link";

type CheckEmailPageProps = {
  searchParams: Promise<{
    email?: string;
  }>;
};

export default async function CheckEmailPage({
  searchParams,
}: CheckEmailPageProps) {
  const {
    email,
  } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-neutral-100">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-semibold">
          Check your email
        </h1>

        <p className="mt-5 text-neutral-400">
          We sent a confirmation link
          {email
            ? ` to ${email}`
            : ""}.
        </p>

        <p className="mt-2 text-neutral-500">
          Confirm the address and you will be redirected back to TinyTools.
        </p>

        <Link
          href="/login"
          className="mt-8 inline-block rounded-xl border border-neutral-700 px-6 py-3"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
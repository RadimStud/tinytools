import Link from "next/link";
import { redirect } from "next/navigation";

import {
  services,
} from "@/server/services";

import {
  signup,
} from "../auth/actions";

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function SignupPage({
  searchParams,
}: SignupPageProps) {
  const currentUser =
    await services.auth
      .getAuthenticatedUser();

  if (currentUser) {
    redirect(
      "/dashboard",
    );
  }

  const {
    error,
  } = await searchParams;

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-neutral-100">
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="text-sm text-neutral-500 hover:text-neutral-300"
        >
          ← TinyTools
        </Link>

        <h1 className="mt-10 text-4xl font-semibold">
          Create account
        </h1>

        <p className="mt-3 text-neutral-400">
          Create a TinyTools developer account.
        </p>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <form
          action={signup}
          className="mt-8 space-y-5"
        >
          <div>
            <label
              htmlFor="displayName"
              className="mb-2 block text-sm text-neutral-400"
            >
              Display name
            </label>

            <input
              id="displayName"
              name="displayName"
              required
              minLength={2}
              autoComplete="name"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4 outline-none focus:border-neutral-600"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm text-neutral-400"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4 outline-none focus:border-neutral-600"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm text-neutral-400"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4 outline-none focus:border-neutral-600"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-neutral-100 px-6 py-4 font-medium text-neutral-950"
          >
            Create account
          </button>
        </form>

        <p className="mt-6 text-sm text-neutral-500">
          Already registered?{" "}

          <Link
            href="/login"
            className="text-neutral-200 hover:text-white"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
import type { Metadata } from "next";
import { LoginForm } from "@/app/login/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-sidebar px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-24 size-96 rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -bottom-32 size-96 rounded-full bg-gold/10 blur-3xl"
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-sidebar-border bg-card p-8 shadow-xl">
        <LoginForm next={next} />
      </div>
    </main>
  );
}

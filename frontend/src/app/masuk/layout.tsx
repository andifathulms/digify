import Link from "next/link";

export default function MasukLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <Link href="/" className="mb-6 text-center">
        <span
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-fraunces)", color: "var(--blue-deep)" }}
        >
          Digify Laris
        </span>
        <span className="mt-1 block text-sm" style={{ color: "var(--ink-dim)" }}>
          Menu Optimizer
        </span>
      </Link>
      {children}
    </div>
  );
}

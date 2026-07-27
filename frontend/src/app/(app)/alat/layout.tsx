import Link from "next/link";

import NavigasiTab from "@/components/ui/NavigasiTab";
import StatusServer from "@/components/ui/StatusServer";

export default function AlatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-8 sm:py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="flex flex-col">
          <span
            className="text-lg leading-tight font-bold"
            style={{ fontFamily: "var(--font-fraunces)", color: "var(--blue-deep)" }}
          >
            Digify Laris
          </span>
          <span className="text-xs" style={{ color: "var(--ink-dim)" }}>
            Menu Optimizer
          </span>
        </Link>
        <StatusServer />
      </header>

      <div className="mt-5">
        <NavigasiTab />
      </div>

      <main className="mt-6 flex flex-col gap-5">{children}</main>
    </div>
  );
}

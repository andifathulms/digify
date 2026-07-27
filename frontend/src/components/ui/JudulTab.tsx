import { cariTab } from "@/lib/tabs";

/** Judul dan satu kalimat penjelas di atas tiap alat. */
export default function JudulTab({ slug }: { slug: string }) {
  const tab = cariTab(slug);
  if (!tab) return null;

  return (
    <header>
      <p className="text-xs font-semibold" style={{ color: "var(--orange)" }}>
        Alat {tab.nomor} dari 10
      </p>
      <h1
        className="mt-1 text-2xl leading-tight font-bold sm:text-3xl"
        style={{ fontFamily: "var(--font-fraunces)" }}
      >
        {tab.judul}
      </h1>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
        {tab.ringkas}
      </p>
    </header>
  );
}

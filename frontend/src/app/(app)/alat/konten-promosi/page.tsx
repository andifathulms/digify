import KontenPromosi from "@/components/tools/KontenPromosi";
import JudulTab from "@/components/ui/JudulTab";

export const metadata = { title: "Konten Promosi — Digify Laris" };

export default function KontenPromosiPage() {
  return (
    <>
      <JudulTab slug="konten-promosi" />
      <KontenPromosi />
    </>
  );
}
